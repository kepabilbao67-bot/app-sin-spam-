import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants';
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
  { max: 0, label: 'Sin amenazas', sub: 'Todo tranquilo', color: COLORS.success, icon: 'shield-checkmark' as const, ring: COLORS.success },
  { max: 5, label: 'Bajo riesgo', sub: 'Actividad mínima', color: '#8BC34A', icon: 'shield-checkmark' as const, ring: '#8BC34A' },
  { max: 20, label: 'Riesgo moderado', sub: 'Vigilancia activa', color: COLORS.warning, icon: 'shield-half' as const, ring: COLORS.warning },
  { max: Infinity, label: 'Alto riesgo', sub: 'Atención necesaria', color: COLORS.danger, icon: 'shield' as const, ring: COLORS.danger },
];

function getThreatLevel(total: number) {
  return THREAT_LEVELS.find(t => total <= t.max) ?? THREAT_LEVELS[THREAT_LEVELS.length - 1];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

const TIPS = [
  'Los bancos nunca piden contraseñas por SMS',
  'Desconfía de premios inesperados por WhatsApp',
  'Verifica siempre el remitente antes de hacer clic',
  'Los números 900 y 803 suelen ser marketing',
  'Un enlace acortado puede esconder phishing',
];

export default function DashboardScreen() {
  const { stats, items, loading, refresh } = useSpamData();
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState('');
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const navigation = useNavigation<any>();

  // Pulsing ring animation
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.15, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  // Fade-in on mount
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const recent = items.slice(0, 5);
  const threat = getThreatLevel(stats.totalBlocked);
  const aiConnected = isAIReady();

  const runDemo = async () => {
    setDemoRunning(true);
    for (const demo of DEMO_CASES) {
      setDemoStep(demo.label);
      await demo.fn();
      await new Promise(r => setTimeout(r, 350));
    }
    await refresh();
    setDemoRunning(false);
    setDemoStep('');
    Alert.alert('Simulación completada', `Se analizaron ${DEMO_CASES.length} amenazas de ejemplo.\n\nRevisa la pestaña "Bloqueados" para ver los resultados.`);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeIn }}>

        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.subtitle}>Tu escudo anti-spam con IA</Text>
          </View>
          <TouchableOpacity style={[styles.aiPill, aiConnected && styles.aiPillActive]} onPress={() => navigation.navigate('Ajustes')}>
            <View style={[styles.aiDot, { backgroundColor: aiConnected ? COLORS.success : COLORS.textMuted }]} />
            <Text style={[styles.aiPillText, { color: aiConnected ? COLORS.success : COLORS.textMuted }]}>
              {aiConnected ? 'IA activa' : 'Sin IA'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero threat card ───────────────────── */}
        <View style={[styles.heroCard, { borderColor: threat.color + '40' }]}>
          {/* Decorative circles */}
          <View style={[styles.heroBg1, { backgroundColor: threat.color + '08' }]} />
          <View style={[styles.heroBg2, { backgroundColor: threat.color + '05' }]} />

          <View style={styles.heroLeft}>
            <Text style={[styles.threatLabel, { color: threat.color }]}>{threat.label}</Text>
            <Text style={styles.threatSub}>{threat.sub}</Text>
            <View style={styles.threatBarTrack}>
              <View style={[styles.threatBarFill, {
                width: `${Math.min(100, Math.max(4, (stats.totalBlocked / Math.max(stats.totalBlocked, 20)) * 100))}%` as any,
                backgroundColor: threat.color,
              }]} />
            </View>
            <Text style={styles.heroMeta}>{stats.totalBlocked} amenazas detectadas en total</Text>
          </View>

          {/* Pulsing shield */}
          <View style={styles.heroRight}>
            <Animated.View style={[styles.pulseRing, {
              borderColor: threat.color,
              transform: [{ scale: pulse }],
              opacity: pulseOpacity,
            }]} />
            <View style={[styles.shieldCircle, { backgroundColor: threat.color + '20', borderColor: threat.color + '44' }]}>
              <Ionicons name={threat.icon} size={34} color={threat.color} />
            </View>
          </View>
        </View>

        {/* ── Stats row ──────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard title="Llamadas" value={stats.callsBlocked} icon="call" color={COLORS.danger} />
          <StatCard title="SMS" value={stats.smsBlocked} icon="chatbubble" color={COLORS.warning} />
          <StatCard title="Emails" value={stats.emailsBlocked} icon="mail" color={COLORS.primary} />
        </View>

        {/* ── Period row ─────────────────────────── */}
        <View style={styles.periodRow}>
          {[
            { label: 'Hoy', value: stats.today, color: COLORS.success },
            { label: 'Esta semana', value: stats.thisWeek, color: COLORS.warning },
            { label: 'Este mes', value: stats.thisMonth, color: COLORS.primary },
          ].map(p => (
            <View key={p.label} style={styles.periodCard}>
              <Text style={[styles.periodValue, { color: p.color }]}>{p.value}</Text>
              <Text style={styles.periodLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick actions 2×2 ──────────────────── */}
        <View style={styles.quickGrid}>
          <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.primary + '40' }]} onPress={() => navigation.navigate('Asistente')}>
            <View style={[styles.quickIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="chatbubble-ellipses" size={22} color={COLORS.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: COLORS.primary }]}>Asistente IA</Text>
            <Text style={styles.quickDesc}>Pregunta sobre spam</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.warning + '40' }]} onPress={() => navigation.navigate('WhatsApp')}>
            <View style={[styles.quickIcon, { backgroundColor: '#25D366' + '20' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <Text style={[styles.quickLabel, { color: '#25D366' }]}>WhatsApp</Text>
            <Text style={styles.quickDesc}>Analiza mensajes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.success + '40' }]} onPress={() => navigation.navigate('Estadísticas')}>
            <View style={[styles.quickIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="bar-chart" size={22} color={COLORS.success} />
            </View>
            <Text style={[styles.quickLabel, { color: COLORS.success }]}>Estadísticas</Text>
            <Text style={styles.quickDesc}>Ver historial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickCard, { borderColor: COLORS.danger + '40' }]} onPress={() => navigation.navigate('Reglas')}>
            <View style={[styles.quickIcon, { backgroundColor: COLORS.danger + '20' }]}>
              <Ionicons name="filter" size={22} color={COLORS.danger} />
            </View>
            <Text style={[styles.quickLabel, { color: COLORS.danger }]}>Mis reglas</Text>
            <Text style={styles.quickDesc}>Listas y bloqueos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent blocked ──────────────────────── */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recientes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bloqueados')} style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>Ver todos</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {recent.map(item => {
              const confPct = Math.round(item.confidence * 100);
              const c = confPct > 85 ? COLORS.danger : confPct > 65 ? COLORS.warning : COLORS.primary;
              return (
                <TouchableOpacity key={item.id} style={styles.recentRow} onPress={() => navigation.navigate('Bloqueados')}>
                  <View style={[styles.recentIcon, { backgroundColor: c + '20' }]}>
                    <Ionicons name={item.type === 'call' ? 'call' : item.type === 'sms' ? 'chatbubble' : 'mail'} size={14} color={c} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentSender} numberOfLines={1}>{item.sender}</Text>
                    <Text style={styles.recentCat}>{item.category}</Text>
                  </View>
                  <View style={[styles.recentBadge, { backgroundColor: c + '20' }]}>
                    <Text style={[styles.recentConf, { color: c }]}>{confPct}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Tip card ───────────────────────────── */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb" size={16} color={COLORS.warning} />
          </View>
          <Text style={styles.tipText}><Text style={styles.tipBold}>Tip: </Text>{TIPS[tipIdx]}</Text>
        </View>

        {/* ── Demo button ─────────────────────────── */}
        <TouchableOpacity style={[styles.demoBtn, demoRunning && styles.demoBtnRunning]} onPress={runDemo} disabled={demoRunning}>
          {demoRunning ? (
            <>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.demoBtnText}>Simulando: {demoStep}...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flask" size={18} color={COLORS.primary} />
              <Text style={styles.demoBtnText}>Simular {DEMO_CASES.length} amenazas de ejemplo</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 14 },
  greeting: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  aiPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  aiPillActive: { borderColor: COLORS.success + '60' },
  aiDot: { width: 7, height: 7, borderRadius: 4 },
  aiPillText: { fontSize: 11, fontWeight: '700' },

  heroCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBg1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -40 },
  heroBg2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, bottom: -40, left: -20 },
  heroLeft: { flex: 1 },
  threatLabel: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 2 },
  threatSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 },
  threatBarTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.surface, overflow: 'hidden', marginBottom: 8, maxWidth: 160 },
  threatBarFill: { height: 6, borderRadius: 3 },
  heroMeta: { fontSize: 11, color: COLORS.textMuted },
  heroRight: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  pulseRing: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 2 },
  shieldCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

  statsRow: { flexDirection: 'row', marginBottom: 12 },

  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodCard: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  periodValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  periodLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  quickCard: { width: '47%', backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, gap: 6 },
  quickIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  quickLabel: { fontSize: 13, fontWeight: '800' },
  quickDesc: { fontSize: 11, color: COLORS.textSecondary },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  recentRow: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  recentIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recentInfo: { flex: 1 },
  recentSender: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  recentCat: { color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', marginTop: 1 },
  recentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  recentConf: { fontWeight: '900', fontSize: 12 },

  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.warning + '12', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.warning + '30' },
  tipIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: COLORS.warning + '20', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  tipText: { flex: 1, color: COLORS.text, fontSize: 13, lineHeight: 19 },
  tipBold: { fontWeight: '800', color: COLORS.warning },

  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary + '18', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.primary + '40' },
  demoBtnRunning: { opacity: 0.7 },
  demoBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});
