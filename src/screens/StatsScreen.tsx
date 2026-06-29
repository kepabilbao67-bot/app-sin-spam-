import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useSpamData } from '../hooks/useSpamData';
import { BlockedItem } from '../types';
import { buildDefaultRules } from '../constants/spamLists';
import { addRule } from '../services/storage';

function BarChart({ data }: { data: { x: string; y: number }[] }) {
  const max = Math.max(...data.map(d => d.y), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, paddingTop: 10 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 9 }}>{d.y > 0 ? d.y : ''}</Text>
          <View style={{
            width: '100%', borderRadius: 4,
            height: Math.max(4, (d.y / max) * 80),
            backgroundColor: d.y > 0 ? COLORS.primary : COLORS.border,
          }} />
          <Text style={{ color: COLORS.textMuted, fontSize: 9 }}>{d.x}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const { items, stats, rules, refresh } = useSpamData();
  const [importing, setImporting] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Category distribution for pie chart
  const categories = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(categories).map(([cat, count]) => ({
    x: cat,
    y: count,
    label: `${cat}\n${count}`,
  }));

  const categoryColors: Record<string, string> = {
    telemarketing: COLORS.warning,
    phishing: COLORS.danger,
    scam: '#FF4081',
    robocall: '#7C4DFF',
    unknown: COLORS.textMuted,
  };

  // Last 7 days bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    const count = items.filter(item => item.timestamp >= dayStart && item.timestamp < dayEnd).length;
    return { x: `${d.getDate()}/${d.getMonth() + 1}`, y: count };
  });

  const exportReport = async () => {
    const lines = [
      '📊 INFORME ANTI-SPAM IA',
      `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
      '',
      `Total bloqueados: ${stats.totalBlocked}`,
      `Hoy: ${stats.today}`,
      `Esta semana: ${stats.thisWeek}`,
      `Este mes: ${stats.thisMonth}`,
      '',
      'Por tipo:',
      `  📞 Llamadas: ${stats.callsBlocked}`,
      `  💬 SMS: ${stats.smsBlocked}`,
      `  📧 Email: ${stats.emailsBlocked}`,
      '',
      'Por categoría:',
      ...Object.entries(categories).map(([cat, n]) => `  ${cat}: ${n}`),
      '',
      `Reglas activas: ${rules.length}`,
    ];
    await Share.share({ message: lines.join('\n') });
  };

  const importSpamList = async () => {
    Alert.alert(
      'Importar lista negra pública',
      `Se añadirán ${30} números y dominios de spam conocidos en España. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar', onPress: async () => {
            setImporting(true);
            const newRules = buildDefaultRules();
            for (const rule of newRules) {
              await addRule(rule as any);
            }
            await refresh();
            setImporting(false);
            Alert.alert('Importado', `${newRules.length} reglas de spam añadidas correctamente.`);
          },
        },
      ]
    );
  };

  const topSpammers = [...items]
    .reduce<{ sender: string; count: number }[]>((acc, item) => {
      const existing = acc.find(a => a.sender === item.sender);
      if (existing) existing.count++;
      else acc.push({ sender: item.sender, count: 1 });
      return acc;
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Estadísticas</Text>
        <TouchableOpacity onPress={exportReport} style={styles.exportBtn}>
          <Ionicons name="share-outline" size={16} color={COLORS.primary} />
          <Text style={styles.exportText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {[
          { label: 'Hoy', value: stats.today, color: COLORS.success },
          { label: 'Semana', value: stats.thisWeek, color: COLORS.warning },
          { label: 'Mes', value: stats.thisMonth, color: COLORS.primary },
          { label: 'Total', value: stats.totalBlocked, color: COLORS.danger },
        ].map(s => (
          <View key={s.label} style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* 7-day bar chart — custom implementation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimos 7 días</Text>
        {last7.some(d => d.y > 0) ? (
          <BarChart data={last7} />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>Sin datos aún — usa "Simular amenazas" en el Dashboard</Text>
          </View>
        )}
      </View>

      {/* Category breakdown */}
      {pieData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Por categoría</Text>
          <View style={styles.legend}>
            {pieData.map(d => {
              const pct = Math.round((d.y / items.length) * 100);
              return (
                <View key={d.x} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: categoryColors[d.x] || COLORS.primary }]} />
                  <Text style={styles.legendLabel}>{d.x}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: categoryColors[d.x] || COLORS.primary }]} />
                  </View>
                  <Text style={styles.legendCount}>{d.y}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Top spammers */}
      {topSpammers.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Remitentes más activos</Text>
          {topSpammers.map((s, i) => (
            <View key={s.sender} style={styles.spammerRow}>
              <Text style={styles.spammerRank}>#{i + 1}</Text>
              <Text style={styles.spammerSender} numberOfLines={1}>{s.sender}</Text>
              <View style={[styles.spammerBadge]}>
                <Text style={styles.spammerCount}>{s.count}x</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Import public list */}
      <TouchableOpacity style={[styles.importBtn, importing && { opacity: 0.6 }]} onPress={importSpamList} disabled={importing}>
        <Ionicons name="cloud-download-outline" size={18} color={COLORS.success} />
        <View style={styles.importInfo}>
          <Text style={styles.importTitle}>{importing ? 'Importando...' : 'Importar lista negra pública'}</Text>
          <Text style={styles.importDesc}>Números y dominios de spam conocidos en España (CNMC/AEPD)</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary + '22', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary + '44' },
  exportText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase', marginTop: 2 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  emptyChart: { height: 100, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center' },
  pieRow: { flexDirection: 'row', alignItems: 'center' },
  legend: { gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { width: 90, color: COLORS.text, fontSize: 12 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.surface, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  legendCount: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right' },
  spammerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  spammerRank: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', width: 24 },
  spammerSender: { flex: 1, color: COLORS.text, fontSize: 13 },
  spammerBadge: { backgroundColor: COLORS.danger + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  spammerCount: { color: COLORS.danger, fontWeight: '700', fontSize: 11 },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.success + '44' },
  importInfo: { flex: 1 },
  importTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  importDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
});
