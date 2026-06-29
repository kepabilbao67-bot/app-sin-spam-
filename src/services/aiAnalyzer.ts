import Anthropic from '@anthropic-ai/sdk';
import { AIAnalysis, SpamCategory } from '../types';
import { SPAM_PATTERNS, KNOWN_SPAM_PREFIXES } from '../constants';

let client: Anthropic | null = null;

export function initAI(apiKey: string) {
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function isAIReady(): boolean {
  return client !== null;
}

export async function testAIConnection(): Promise<{ ok: boolean; model?: string; error?: string }> {
  if (!client) return { ok: false, error: 'No hay API key configurada' };
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return { ok: true, model: msg.model };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de conexión' };
  }
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

  // Check against known spam prefixes
  const isKnownSpam = KNOWN_SPAM_PREFIXES.some(prefix => sender.startsWith(prefix));
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

    // URLs suspicious
    if (/https?:\/\/[^\s]+/.test(content) && type === 'sms') {
      score += 0.2;
      reasons.push('Contiene URL sospechosa');
    }

    // CAPS heavy
    const capsRatio = (content.match(/[A-ZÁÉÍÓÚ]/g) || []).length / content.length;
    if (capsRatio > 0.4 && content.length > 20) {
      score += 0.15;
      reasons.push('Uso excesivo de mayúsculas');
    }
  }

  // Unknown short number
  if (/^\d{4,6}$/.test(sender.replace(/\s/g, ''))) {
    score += 0.25;
    category = 'telemarketing';
    reasons.push('Número corto típico de marketing');
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
  if (!client) {
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback to local analysis
  }

  return analyzeLocally(sender, content, type);
}

// Batch analyze for demo/testing
export function generateDemoData() {
  const demos = [
    { sender: '+34900123456', content: '¡ENHORABUENA! Has ganado un iPhone. Llama ahora.', type: 'sms' as const },
    { sender: '+34666123456', content: 'Hola Pedro, ¿quedamos mañana?', type: 'sms' as const },
    { sender: '800123', content: 'Oferta limitada: préstamo de 10.000€ sin avales.', type: 'sms' as const },
    { sender: 'noreply@banco-seguro.tk', content: 'Su cuenta ha sido suspendida. Verifique ahora.', type: 'email' as const },
    { sender: '+34912345678', content: undefined, type: 'call' as const },
  ];

  return demos.map(d => analyzeLocally(d.sender, d.content, d.type));
}
