import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BlockedItem, Rule, AppSettings, Stats } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

const API_KEY_WEB_KEY = 'antispam_api_key_web';

export async function getApiKey(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync('antispam_api_key');
    }
    return await AsyncStorage.getItem(API_KEY_WEB_KEY);
  } catch { return null; }
}

export async function saveApiKey(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('antispam_api_key', key);
    } else {
      await AsyncStorage.setItem(API_KEY_WEB_KEY, key);
    }
  } catch { await AsyncStorage.setItem(API_KEY_WEB_KEY, key); }
}

export async function deleteApiKey(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync('antispam_api_key').catch(() => {});
    }
    await AsyncStorage.removeItem(API_KEY_WEB_KEY).catch(() => {});
  } catch { }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings = data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    // Load api key from secure store
    settings.apiKey = (await getApiKey()) || undefined;
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const { apiKey, ...rest } = settings;
  // API key saved separately in SecureStore
  if (apiKey) await saveApiKey(apiKey);
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(rest));
}

export async function getBlockedItems(): Promise<BlockedItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addBlockedItem(item: BlockedItem): Promise<void> {
  const items = await getBlockedItems();
  items.unshift(item);
  await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ITEMS, JSON.stringify(items.slice(0, 500)));
  await updateStats(item.type);
}

export async function removeBlockedItem(id: string): Promise<void> {
  const items = await getBlockedItems();
  await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ITEMS, JSON.stringify(items.filter(i => i.id !== id)));
}

export async function getRules(): Promise<Rule[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RULES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addRule(rule: Rule): Promise<void> {
  const rules = await getRules();
  rules.push(rule);
  await AsyncStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
}

export async function removeRule(id: string): Promise<void> {
  const rules = await getRules();
  await AsyncStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules.filter(r => r.id !== id)));
}

export async function exportRules(): Promise<string> {
  const rules = await getRules();
  return JSON.stringify(rules, null, 2);
}

export async function importRules(json: string): Promise<number> {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Formato inválido');
  const valid = parsed.filter((r: any) =>
    typeof r.id === 'string' && typeof r.value === 'string' &&
    ['whitelist', 'blacklist', 'pattern'].includes(r.type) &&
    ['all', 'call', 'sms', 'email'].includes(r.channel)
  ) as Rule[];
  const existing = await getRules();
  const existingIds = new Set(existing.map(r => r.id));
  const newRules = valid.filter(r => !existingIds.has(r.id));
  await AsyncStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify([...existing, ...newRules]));
  return newRules.length;
}

export async function getStats(): Promise<Stats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
    return data ? JSON.parse(data) : {
      totalBlocked: 0, callsBlocked: 0, smsBlocked: 0,
      emailsBlocked: 0, today: 0, thisWeek: 0, thisMonth: 0,
    };
  } catch {
    return { totalBlocked: 0, callsBlocked: 0, smsBlocked: 0, emailsBlocked: 0, today: 0, thisWeek: 0, thisMonth: 0 };
  }
}

async function updateStats(type: BlockedItem['type']): Promise<void> {
  const now = Date.now();
  const stats = await getStats();

  const lastReset = stats.lastResetDate || 0;
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const weekStart = dayStart - today.getDay() * 86400000;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  if (lastReset < dayStart) stats.today = 0;
  if (lastReset < weekStart) stats.thisWeek = 0;
  if (lastReset < monthStart) stats.thisMonth = 0;

  stats.totalBlocked += 1;
  stats.today += 1;
  stats.thisWeek += 1;
  stats.thisMonth += 1;
  stats.lastResetDate = now;
  if (type === 'call') stats.callsBlocked += 1;
  if (type === 'sms') stats.smsBlocked += 1;
  if (type === 'email') stats.emailsBlocked += 1;
  await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.BLOCKED_ITEMS),
    AsyncStorage.removeItem(STORAGE_KEYS.STATS),
    AsyncStorage.removeItem(STORAGE_KEYS.RULES),
    AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
    deleteApiKey(),
  ]);
}
