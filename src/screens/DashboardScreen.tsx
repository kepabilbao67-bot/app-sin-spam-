import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import StatCard from '../components/StatCard';
import { useSpamData } from '../hooks/useSpamData';
import { processSMS, processCall, processEmail } from '../services/spamDetector';
import { isAIReady } from '../services/aiAnalyzer';

const DEMO_CASES = [
  { fn: () => processSMS('+34900123456', '¡ENHORABUENA! Has ganado un iPhone 15. Llama ahora al 900.'), label: 'SMS telemarketing' },
  { fn: () => processCall('+34803456789'), label: 'Llamada robocall' },
  { fn: () => processEmail('noreply@banco-urgente.tk', 'Su cuenta ha sido suspendida. Verifique ahora.'), label: 'Email phishing' },
  { fn: () => processSMS('800123', 'Oferta EXCLUSIVA: crédito fácil 10.000€ sin avales. Pincha aquí: http://bit.ly/xxx'), label: 'SMS estafa' },
  { fn: () => processEmail('sorteos@premios-gratis.net', 'Has sido seleccionado para ganar 5.000€'), label: 'Email scam' },
];

const THREAT_LEVELS = [
  { max: 0, label: 'Sin amenazas', color: COLORS.success, icon: 'shield-checkmark' as const },
  { max: 5, label: 'Bajo riesgo', color: '#8BC34A', icon: 'shield-checkmark' as const },
  { max: 20, label: 'Riesgo moderado', color: COLORS.warning, icon: 'shield-half' as const },
  { max: Infinity, label: 'Alto riesgo', color: COLORS.danger, icon: 'shield' as const },
];

function getThreatLevel(total: number) {
  return THREAT_LEVELS.find(t => total <= t.max) ?? THREAT_LEVELS[THREAT_LEVELS.length - 1];
}

const QUICK_TIPS = [
  'Nunca compartas contraseñas por SMS',
  'Los bancos nunca piden datos por mensaje',
  'Desconfía de premios inesperados',
  'Verifica siempre el remitente del email',
];

export default function DashboardScreen() {
  const { stats, items, settings, loading, refresh } = useSpamData();
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState('');
  const [tipIdx] = useState(() => Math.floor(Math.random() * QUICK_TIPS.length));
  const navigation = useNavigation<any>();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const recent = items.slice(0, 4);
  const threat = getThreatLevel(stats.totalBlocked);
  const aiConnected = isAIReady();

  const runDemo = async () => {
    setDemoRunning(true);
    for (const demo of DEMO_CASES) {
      setDemoStep(`Analizando: ${demo.label}...`);
      await demo.fn();
      await new Promise(r => setTimeout(r, 400));
    }
    await refresh();
    setDemoRunning(false);
    setDemoStep('');
    Alert.alert('Simulación completada', `Se analizaron ${DEMO_CASES.length} amenazas. Comprueba la pestaña "Bloqueados".`);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola 👋</Text>
          <Text style={styles.subtitle}>Tu protección anti-spam con IA</Text>
        </View>
        <View style={[styles.shieldBadge, { backgroundColor: threat.color + '22', borderColor: threat.color + '44' }]}>
          <Ionicons name={threat.icon} size={28} color={threat.color} />
        </View>
      </View>

      {/* Threat level card */}
      <View style={[styles.threatCard, { borderColor: threat.color + '55' }]}>
        <View style={styles.threatLeft}>
          <Text style={[styles.threatLevel, { color: threat.color }]}>{threat.label}</Text>
          <Text style={styles.threatSub}>Basado en {stats.totalBlocked} amenazas detectadas</Text>
          <View style={styles.threatBar}>
            <View style={[styles.threatFill, {
              width: `${Math.min(100, (stats.thisWeek / Math.max(stats.thisWeek, 10)) * 100)}%` as any,
              backgroundColor: threat.color,
            }]} />
          </View>
        </View>
        <View style={styles.threatRight}>
          <Text style={[styles.threatBig, { color: threat.color }]}>{stats.totalBlocked}</Text>
          <Text style={styles.threatBigLabel}>total</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard title="Llamadas" value={stats.callsBlocked} icon="call" color={COLORS.danger} />
        <StatCard title="SMS" value={stats.smsBlocked} icon="chatbubble" color={COLORS.warning} />
        <StatCard title="Emails" value={stats.emailsBlocked} icon="mail" color={COLORS.primary} />
      </View>

      {/* Period badges */}
      <View style={styles.periodRow}>
        {[
          { label: 'Hoy', value: stats.today, color: COLORS.success },
          { label: 'Semana', value: stats.thisWeek, color: COLORS.warning },
          { label: 'Mes', value: stats.thisMonth, color: COLORS.primary },
        ].map(p => (
          <View key={p.label} style={styles.periodBadge}>
            <Text style={[styles.periodValue, { color: p.color }]}>{p.value}</Text>
            <Text style={styles.periodLabel}>{p.label}</Text>
          </View>
        ))}
      </View>

      {/* AI status + quick actions */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={[styles.quickCard, { borderColor: (aiConnected ? COLORS.success : COLORS.textMuted) + '44' }]}
          onPress={() => navigation.navigate('Ajustes')}>
          <Ionicons name="sparkles" size={20} color={aiConnected ? COLORS.success : COLORS.textMuted} />
          <Text style={[styles.quickLabel, { color: aiConnected ? COLORS.success : COLORS.textMuted }]}>
            {aiConnected ? 'Claude AI activo' : 'Activar Claude AI'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.primary + '44' }]}
          onPress={() => navigation.navigate('Asistente')}>
          <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
          <Text style={[styles.quickLabel, { color: COLORS.primary }]}>Preguntar al asistente</Text>
        </TouchableOpacity>
      </View>

      {/* Recent blocked */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bloqueados recientemente</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bloqueados')}>
              <Text style={styles.seeAll}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {recent.map(item => (
            <View key={item.id} style={styles.recentItem}>
              <View style={[styles.recentIcon, { backgroundColor: COLORS.danger + '22' }]}>
                <Ionicons name={item.type === 'call' ? 'call' : item.type === 'sms' ? 'chatbubble' : 'mail'} size={14} color={COLORS.danger} />
              </View>
              <Text style={styles.recentSender} numberOfLines={1}>{item.sender}</Text>
              <View style={[styles.recentBadge, { backgroundColor: COLORS.danger + '22' }]}>
                <Text style={styles.recentConf}>{Math.round(item.confidence * 100)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Daily tip */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color={COLORS.warning} />
        <Text style={styles.tipText}><Text style={styles.tipBold}>Consejo: </Text>{QUICK_TIPS[tipIdx]}</Text>
      </View>

      {/* Demo button */}
      <TouchableOpacity style={[styles.demoBtn, demoRunning && { opacity: 0.7 }]} onPress={runDemo} disabled={demoRunning}>
        {demoRunning
          ? <><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.demoBtnText}>{demoStep}</Text></>
          : <><Ionicons name="flask-outline" size={18} color={COLORS.primary} /><Text style={styles.demoBtnText}>Simular {DEMO_CASES.length} amenazas con IA</Text></>
        }
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  shieldBadge: { width: 56, height: 56, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  threatCard: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1 },
  threatLeft: { flex: 1 },
  threatLevel: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  threatSub: { fontSize: 11, color: COLORS.textMuted, marginBottom: 10 },
  threatBar: { height: 6, borderRadius: 3, backgroundColor: COLORS.surface, overflow: 'hidden' },
  threatFill: { height: 6, borderRadius: 3, minWidth: 6 },
  threatRight: { alignItems: 'center', marginLeft: 16 },
  threatBig: { fontSize: 40, fontWeight: '900', lineHeight: 44 },
  threatBigLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', marginBottom: 10 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  periodBadge: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  periodValue: { fontSize: 20, fontWeight: '900' },
  periodLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  section: { marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  seeAll: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  recentItem: { backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  recentIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  recentSender: { flex: 1, color: COLORS.text, fontSize: 13 },
  recentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recentConf: { color: COLORS.danger, fontWeight: '800', fontSize: 12 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.warning + '15', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.warning + '33' },
  tipText: { flex: 1, color: COLORS.text, fontSize: 12, lineHeight: 18 },
  tipBold: { fontWeight: '700', color: COLORS.warning },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary + '22', borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: COLORS.primary + '44' },
  demoBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13, flex: 1, textAlign: 'center' },
});
