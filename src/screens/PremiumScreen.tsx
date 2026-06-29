import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Pricing tiers
const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: '0€',
    period: '',
    color: COLORS.textMuted,
    features: [
      { ok: true, text: 'Análisis local de patrones' },
      { ok: true, text: 'Hasta 100 reglas' },
      { ok: true, text: 'Historial últimos 30 días' },
      { ok: true, text: 'Analizador WhatsApp manual' },
      { ok: false, text: 'Claude AI en tiempo real' },
      { ok: false, text: 'Sin anuncios' },
      { ok: false, text: 'Lista negra actualizada' },
      { ok: false, text: 'Soporte prioritario' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '2,99€',
    period: '/mes',
    color: COLORS.primary,
    badge: 'MÁS POPULAR',
    features: [
      { ok: true, text: 'Todo lo de Gratis' },
      { ok: true, text: 'Claude AI integrado (sin límite)' },
      { ok: true, text: 'Sin anuncios' },
      { ok: true, text: 'Reglas ilimitadas' },
      { ok: true, text: 'Historial ilimitado' },
      { ok: true, text: 'Lista negra actualizada semanalmente' },
      { ok: false, text: 'Soporte prioritario 24h' },
      { ok: false, text: 'API key compartida (sin coste extra)' },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '7,99€',
    period: '/mes',
    color: '#FFD700',
    features: [
      { ok: true, text: 'Todo lo de Pro' },
      { ok: true, text: 'API key compartida incluida' },
      { ok: true, text: 'Soporte prioritario 24h' },
      { ok: true, text: 'Análisis de familia (3 dispositivos)' },
      { ok: true, text: 'Informes PDF mensuales' },
      { ok: true, text: 'Bloqueo automático avanzado' },
      { ok: true, text: 'Acceso anticipado a nuevas funciones' },
      { ok: true, text: 'Sin publicidad nunca' },
    ],
  },
];

export default function PremiumScreen() {
  const [selected, setSelected] = useState('pro');

  const subscribe = (planId: string) => {
    if (planId === 'free') return;
    Alert.alert(
      'Suscripción',
      `Para activar el plan ${PLANS.find(p => p.id === planId)?.name}, integra expo-in-app-purchases o RevenueCat con tu cuenta de Google Play / App Store.\n\nEn producción esto abre el pago nativo de la tienda.`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver guía RevenueCat', onPress: () => Linking.openURL('https://www.revenuecat.com/docs/getting-started') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.crownCircle}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>
        <Text style={styles.heroTitle}>Anti-Spam IA Premium</Text>
        <Text style={styles.heroSub}>Protección total con inteligencia artificial</Text>
      </View>

      {PLANS.map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, selected === plan.id && { borderColor: plan.color, borderWidth: 2 }]}
          onPress={() => setSelected(plan.id)}
          activeOpacity={0.85}
        >
          {plan.badge && (
            <View style={[styles.badge, { backgroundColor: plan.color }]}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <View>
              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                {plan.period ? <Text style={styles.planPeriod}>{plan.period}</Text> : null}
              </View>
            </View>
            <View style={[styles.radio, selected === plan.id && { borderColor: plan.color }]}>
              {selected === plan.id && <View style={[styles.radioDot, { backgroundColor: plan.color }]} />}
            </View>
          </View>
          <View style={styles.features}>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons
                  name={f.ok ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={f.ok ? plan.color : COLORS.textMuted}
                />
                <Text style={[styles.featureText, !f.ok && styles.featureOff]}>{f.text}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      {selected !== 'free' && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: PLANS.find(p => p.id === selected)?.color }]}
          onPress={() => subscribe(selected)}
        >
          <Ionicons name="lock-open" size={18} color="#000" />
          <Text style={styles.ctaBtnText}>
            Activar {PLANS.find(p => p.id === selected)?.name} — {PLANS.find(p => p.id === selected)?.price}{PLANS.find(p => p.id === selected)?.period}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.adNote}>
        <Ionicons name="megaphone-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.adNoteText}>Los usuarios gratuitos ven anuncios de AdMob. Hazte Pro para eliminarlos.</Text>
      </View>

      <View style={styles.restore}>
        <TouchableOpacity onPress={() => Alert.alert('Restaurar compra', 'Función disponible en producción.')}>
          <Text style={styles.restoreText}>Restaurar compra anterior</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>Suscripción renovada automáticamente. Cancela en cualquier momento desde los ajustes de la tienda. Precios sin IVA.</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  hero: { alignItems: 'center', paddingVertical: 24 },
  crownCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFD700' + '22', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#FFD700' + '44' },
  crownEmoji: { fontSize: 34 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  planCard: { backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'visible' },
  badge: { position: 'absolute', top: -10, right: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, zIndex: 1 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  planName: { fontSize: 18, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  planPrice: { fontSize: 26, fontWeight: '900' },
  planPeriod: { color: COLORS.textMuted, fontSize: 13 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  features: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: COLORS.text, fontSize: 13 },
  featureOff: { color: COLORS.textMuted },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, padding: 16, marginBottom: 12 },
  ctaBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  adNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 16 },
  adNoteText: { flex: 1, color: COLORS.textMuted, fontSize: 11, lineHeight: 16 },
  restore: { alignItems: 'center', gap: 8 },
  restoreText: { color: COLORS.primary, fontSize: 13, textDecorationLine: 'underline' },
  legal: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 14, paddingHorizontal: 10 },
});
