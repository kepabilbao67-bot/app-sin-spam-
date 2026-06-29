import { useState, useCallback } from 'react';
import { BlockedItem, Stats, Rule, AppSettings } from '../types';
import { getBlockedItems, getStats, getRules, getSettings, removeBlockedItem, addRule, removeRule, saveSettings } from '../services/storage';

export function useSpamData() {
  const [items, setItems] = useState<BlockedItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalBlocked: 0, callsBlocked: 0, smsBlocked: 0, emailsBlocked: 0, today: 0, thisWeek: 0, thisMonth: 0 });
  const [rules, setRules] = useState<Rule[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [i, s, r, cfg] = await Promise.all([
      getBlockedItems(),
      getStats(),
      getRules(),
      getSettings(),
    ]);
    setItems(i);
    setStats(s);
    setRules(r);
    setSettingsState(cfg);
    setLoading(false);
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await removeBlockedItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const createRule = useCallback(async (rule: Rule) => {
    await addRule(rule);
    setRules(prev => [...prev, rule]);
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    await removeRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateSettings = useCallback(async (s: AppSettings) => {
    await saveSettings(s);
    setSettingsState(s);
  }, []);

  return { items, stats, rules, settings, loading, refresh, deleteItem, createRule, deleteRule, updateSettings };
}
