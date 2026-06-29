import { BlockedItem, Rule } from '../types';
import { analyzeLocally, analyzeWithAI } from './aiAnalyzer';
import { getRules, getSettings, addBlockedItem } from './storage';
import { sendBlockedNotification } from './notifications';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

async function checkRules(
  sender: string,
  channel: 'call' | 'sms' | 'email',
  content?: string
): Promise<{ action: 'allow' | 'block' | 'analyze'; rule?: Rule }> {
  const rules = await getRules();

  for (const rule of rules) {
    if (rule.channel !== 'all' && rule.channel !== channel) continue;

    const testStr = content ? `${sender} ${content}` : sender;
    let matches: boolean;
    try {
      matches = rule.type === 'pattern'
        ? new RegExp(rule.value, 'i').test(testStr)
        : testStr.toLowerCase().includes(rule.value.toLowerCase());
    } catch {
      continue; // skip malformed patterns
    }

    if (matches) {
      if (rule.type === 'whitelist') return { action: 'allow', rule };
      if (rule.type === 'blacklist') return { action: 'block', rule };
    }
  }

  return { action: 'analyze' };
}

export async function processCall(phoneNumber: string): Promise<BlockedItem | null> {
  const settings = await getSettings();
  if (!settings.callBlockingEnabled) return null;

  const ruleCheck = await checkRules(phoneNumber, 'call');
  if (ruleCheck.action === 'allow') return null;

  let analysis;
  if (ruleCheck.action === 'block') {
    analysis = { isSpam: true, confidence: 1.0, category: 'telemarketing' as const, reason: 'En lista negra' };
  } else {
    analysis = settings.aiAnalysisEnabled
      ? await analyzeWithAI(phoneNumber, '', 'call')
      : analyzeLocally(phoneNumber, undefined, 'call');
  }

  if (!analysis.isSpam || analysis.confidence < settings.confidenceThreshold) return null;

  const item: BlockedItem = {
    id: generateId(),
    type: 'call',
    sender: phoneNumber,
    timestamp: Date.now(),
    category: analysis.category,
    confidence: analysis.confidence,
    blocked: true,
    reason: analysis.reason,
  };

  await addBlockedItem(item);
  if (settings.notificationsEnabled) sendBlockedNotification(item).catch(() => {});
  return item;
}

export async function processSMS(
  phoneNumber: string,
  message: string
): Promise<BlockedItem | null> {
  const settings = await getSettings();
  if (!settings.smsFilteringEnabled) return null;

  const ruleCheck = await checkRules(phoneNumber, 'sms', message);
  if (ruleCheck.action === 'allow') return null;

  let analysis;
  if (ruleCheck.action === 'block') {
    analysis = { isSpam: true, confidence: 1.0, category: 'scam' as const, reason: 'En lista negra' };
  } else {
    analysis = settings.aiAnalysisEnabled
      ? await analyzeWithAI(phoneNumber, message, 'sms')
      : analyzeLocally(phoneNumber, message, 'sms');
  }

  if (!analysis.isSpam || analysis.confidence < settings.confidenceThreshold) return null;

  const item: BlockedItem = {
    id: generateId(),
    type: 'sms',
    sender: phoneNumber,
    content: message.substring(0, 200),
    timestamp: Date.now(),
    category: analysis.category,
    confidence: analysis.confidence,
    blocked: true,
    reason: analysis.reason,
  };

  await addBlockedItem(item);
  if (settings.notificationsEnabled) sendBlockedNotification(item).catch(() => {});
  return item;
}

export async function processEmail(
  from: string,
  subject: string,
  body?: string
): Promise<BlockedItem | null> {
  const settings = await getSettings();
  if (!settings.emailFilteringEnabled) return null;

  const content = `Asunto: ${subject}${body ? `. Cuerpo: ${body.substring(0, 300)}` : ''}`;

  const ruleCheck = await checkRules(from, 'email', content);
  if (ruleCheck.action === 'allow') return null;

  let analysis;
  if (ruleCheck.action === 'block') {
    analysis = { isSpam: true, confidence: 1.0, category: 'phishing' as const, reason: 'En lista negra' };
  } else {
    analysis = settings.aiAnalysisEnabled
      ? await analyzeWithAI(from, content, 'email')
      : analyzeLocally(from, content, 'email');
  }

  if (!analysis.isSpam || analysis.confidence < settings.confidenceThreshold) return null;

  const item: BlockedItem = {
    id: generateId(),
    type: 'email',
    sender: from,
    content: subject,
    timestamp: Date.now(),
    category: analysis.category,
    confidence: analysis.confidence,
    blocked: true,
    reason: analysis.reason,
  };

  await addBlockedItem(item);
  if (settings.notificationsEnabled) sendBlockedNotification(item).catch(() => {});
  return item;
}
