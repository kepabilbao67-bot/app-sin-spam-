import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockedItem, Rule, AppSettings, Stats } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
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
  const trimmed = items.slice(0, 500);
  await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ITEMS, JSON.stringify(trimmed));
  await updateStats(item.type);
}

export async function removeBlockedItem(id: string): Promise<void> {
  const items = await getBlockedItems();
  const filtered = items.filter(i => i.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ITEMS, JSON.stringify(filtered));
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
  const filtered = rules.filter(r => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(filtered));
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
  const stats = await getStats();
  stats.totalBlocked += 1;
  stats.today += 1;
  stats.thisWeek += 1;
  stats.thisMonth += 1;
  if (type === 'call') stats.callsBlocked += 1;
  if (type === 'sms') stats.smsBlocked += 1;
  if (type === 'email') stats.emailsBlocked += 1;
  await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.BLOCKED_ITEMS);
  await AsyncStorage.removeItem(STORAGE_KEYS.STATS);
}
