import Anthropic from '@anthropic-ai/sdk';
import { Platform } from 'react-native';
import { AIAnalysis, SpamCategory } from '../types';
import { SPAM_PATTERNS, KNOWN_SPAM_PREFIXES, CLAUDE_MODEL } from '../constants';

let client: Anthropic | null = null;

// Rate limiting: max 10 AI calls per minute
const callTimestamps: number[] = [];
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function isRateLimited(): boolean {
  const now = Date.now();
  const recent = callTimestamps.filter(t => now - t < RATE_WINDOW);
  callTimestamps.splice(0, callTimestamps.length, ...recent);
  return recent.length >= RATE_LIMIT;
}

function recordCall(): void {
  callTimestamps.push(Date.now());
}

export function initAI(apiKey: string) {
  // dangerouslyAllowBrowser only needed on web — React Native is not a browser
  const opts: ConstructorParameters<typeof Anthropic>[0] = { apiKey };
  if (Platform.OS === 'web') (opts as any).dangerouslyAllowBrowser = true;
  client = new Anthropic(opts);
}

// Texto de la respuesta. Claude Haiku 5.5 piensa por defecto y la respuesta puede
// empezar con bloques "thinking", así que no vale leer content[0]: se juntan los
// bloques de texto. Devuelve '' si el modelo rechazó la petición (stop_reason "refusal").
export function responseText(message: Anthropic.Message): string {
  if (message.stop_reason === 'refusal') return '';
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');
}

export function isAIReady(): boolean {
  return client !== null;
}

export async function testAIConnection(): Promise<{ ok: boolean; model?: string; error?: string }> {
  if (!client) return { ok: false, error: 'No hay API key configurada' };
  try {
    const msg = await client.messages.create({
      model: CLAUDE_MODEL,
      // Margen para el pensamiento del modelo; con effort "low" apenas piensa.
      max_tokens: 256,
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: 'ping' }],
    });
    return { ok: true, model: msg.model };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de conexión' };
  }
}

// Normalize phone number to consistent format for rule matching
export function normalizePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-().]/g, '');
  // Add + prefix if missing from international numbers starting with 00
  if (stripped.startsWith('00')) return '+' + stripped.slice(2);
  return stripped;
}

// Local heuristic analysis (works without API key)
export function analyzeLocally(
  sender: string,
  content?: string,
  type: 'call' | 'sms' | 'email' = 'sms'
): AIAnalysis {
  let score = 0;
  let category: SpamCategory = 'unknown';
  const reasons: string[] = [];

  const normalized = normalizePhone(sender);

  // Check against known spam prefixes
  const isKnownSpam = KNOWN_SPAM_PREFIXES.some(prefix => normalized.startsWith(prefix));
  if (isKnownSpam) {
    score += 0.6;
    category = 'telemarketing';
    reasons.push('Número con prefijo de spam conocido');
  }

  // Check content patterns
  if (content) {
    const matchedPatterns = SPAM_PATTERNS.filter(p => p.test(content));
    if (matchedPatterns.length > 0) {
      score += Math.min(0.5, matchedPatterns.length * 0.15);
      category = 'scam';
      reasons.push(`${matchedPatterns.length} patrón(es) de spam detectado(s)`);
    }
    if (/https?:\/\/[^\s]+/.test(content) && type === 'sms') {
      score += 0.2;
      reasons.push('Contiene URL sospechosa');
    }
    const capsRatio = (content.match(/[A-ZÁÉÍÓÚ]/g) || []).length / content.length;
    if (capsRatio > 0.4 && content.length > 20) {
      score += 0.15;
      reasons.push('Uso excesivo de mayúsculas');
    }
  }

  // Short marketing codes — only mark suspicious if no legitimate pattern
  // Legitimate 2FA codes are 4-6 digits but are one-time and rare
  if (/^\d{4,6}$/.test(sender.replace(/\s/g, '')) && content && SPAM_PATTERNS.some(p => p.test(content))) {
    score += 0.3;
    category = 'telemarketing';
    reasons.push('Número corto con contenido sospechoso');
  }

  // Suspicious email domains
  if (type === 'email') {
    const suspiciousTLD = /\.(tk|ml|ga|cf|gq|xyz|top|club|win|loan)$/i.test(sender);
    if (suspiciousTLD) {
      score += 0.35;
      category = 'phishing';
      reasons.push('Dominio de email sospechoso');
    }
  }

  const confidence = Math.min(0.99, score);
  return {
    isSpam: confidence >= 0.5,
    confidence,
    category,
    reason: reasons.length > 0 ? reasons.join('. ') : 'Sin indicadores de spam',
  };
}

// AI-powered analysis using Claude
export async function analyzeWithAI(
  sender: string,
  content: string,
  type: 'call' | 'sms' | 'email'
): Promise<AIAnalysis> {
  if (!client || isRateLimited()) {
    return analyzeLocally(sender, content, type);
  }

  try {
    const prompt = `Analiza si este ${type === 'call' ? 'número de llamada' : type === 'sms' ? 'mensaje SMS' : 'correo'} es spam o fraudulento.

Remitente: ${sender}
${content ? `Contenido: "${content}"` : ''}
Tipo: ${type}

Responde SOLO con JSON válido:
{
  "isSpam": boolean,
  "confidence": número entre 0 y 1,
  "category": "telemarketing" | "phishing" | "scam" | "robocall" | "unknown",
  "reason": "explicación breve en español"
}`;

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      // El pensamiento cuenta para max_tokens: 200 podía agotarse antes del JSON.
      max_tokens: 1024,
      output_config: { effort: 'low' }, // clasificación sencilla y frecuente
      messages: [{ role: 'user', content: prompt }],
    });
    recordCall();

    // Si el modelo rechaza la petición, text queda vacío y se usa el análisis local.
    const text = responseText(message);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (
        typeof parsed.isSpam === 'boolean' &&
        typeof parsed.confidence === 'number' &&
        typeof parsed.reason === 'string'
      ) {
        return parsed as AIAnalysis;
      }
    }
  } catch {
    // fallback silently
  }

  return analyzeLocally(sender, content, type);
}
