import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import StatCard from '../components/StatCard';
import { useSpamData } from '../hooks/useSpamData';
import { processSMS, processCall, processEmail } from '../services/spamDetector';

export default function DashboardScreen() {
  const { stats, items, loading, refresh } = useSpamData();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const recent = items.slice(0, 3);

  const runDemo = async () => {
    Alert.alert('Simulación IA', 'Analizando mensajes de prueba con IA local...');
    await processSMS('+34900123456', '¡ENHORABUENA! Has ganado un iPhone 15. Llama ahora al 900 para reclamarlo.');
    await processCall('+34803456789');
    await processEmail('noreply@banco-urgente.tk', 'Su cuenta ha sido suspendida. Verifique ahora.');
    await refresh();
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Protección Activa</Text>
          <Text style={styles.subtitle}>Tu escudo anti-spam con IA</Text>
        </View>
        <View style={styles.shieldContainer}>
          <Ionicons name="shield-checkmark" size={44} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroNumber}>{stats.totalBlocked}</Text>
        <Text style={styles.heroLabel}>amenazas bloqueadas en total</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="today" size={12} color={COLORS.success} />
            <Text style={styles.heroBadgeText}>{stats.today} hoy</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="calendar" size={12} color={COLORS.warning} />
            <Text style={styles.heroBadgeText}>{stats.thisWeek} semana</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="Llamadas" value={stats.callsBlocked} icon="call" color={COLORS.danger} />
        <StatCard title="SMS" value={stats.smsBlocked} icon="chatbubble" color={COLORS.warning} />
        <StatCard title="Emails" value={stats.emailsBlocked} icon="mail" color={COLORS.primary} />
      </View>

      {recent.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bloqueados recientemente</Text>
          {recent.map(item => (
            <View key={item.id} style={styles.recentItem}>
              <Ionicons name={item.type === 'call' ? 'call' : item.type === 'sms' ? 'chatbubble' : 'mail'} size={16} color={COLORS.danger} />
              <Text style={styles.recentSender} numberOfLines={1}>{item.sender}</Text>
              <Text style={styles.recentConf}>{Math.round(item.confidence * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.demoBtn} onPress={runDemo}>
        <Ionicons name="flask" size={18} color={COLORS.primary} />
        <Text style={styles.demoBtnText}>Simular detección IA</Text>
      </TouchableOpacity>

      <View style={styles.aiInfo}>
        <Ionicons name="sparkles" size={16} color={COLORS.primary} />
        <Text style={styles.aiInfoText}>IA activa: análisis local de patrones + Claude AI (opcional)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  greeting: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  shieldContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center' },
  heroCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '44' },
  heroNumber: { fontSize: 56, fontWeight: '900', color: COLORS.primary },
  heroLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  heroRow: { flexDirection: 'row', gap: 12 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { fontSize: 11, color: COLORS.text },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  recentItem: { backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  recentSender: { flex: 1, color: COLORS.text, fontSize: 13 },
  recentConf: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary + '22', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + '44' },
  demoBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  aiInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 24 },
  aiInfoText: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
});
