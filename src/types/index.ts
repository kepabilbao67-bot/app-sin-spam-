export type SpamCategory = 'telemarketing' | 'phishing' | 'scam' | 'robocall' | 'unknown';

export interface BlockedItem {
  id: string;
  type: 'call' | 'sms' | 'email' | 'app';
  sender: string;
  content?: string;
  timestamp: number;
  category: SpamCategory;
  confidence: number;
  blocked: boolean;
  reason: string;
}

export interface Rule {
  id: string;
  type: 'whitelist' | 'blacklist' | 'pattern';
  value: string;
  channel: 'call' | 'sms' | 'email' | 'all';
  createdAt: number;
}

export interface Stats {
  totalBlocked: number;
  callsBlocked: number;
  smsBlocked: number;
  emailsBlocked: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface AIAnalysis {
  isSpam: boolean;
  confidence: number;
  category: SpamCategory;
  reason: string;
}

export interface AppSettings {
  callBlockingEnabled: boolean;
  smsFilteringEnabled: boolean;
  emailFilteringEnabled: boolean;
  aiAnalysisEnabled: boolean;
  autoBlockHighConfidence: boolean;
  confidenceThreshold: number;
  notificationsEnabled: boolean;
  apiKey?: string;
  allowUnknownNumbers: boolean;
  blockInternational: boolean;
}
