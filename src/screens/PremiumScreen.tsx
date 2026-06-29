import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants';

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: '0€',
    period: '',
    color: COLORS.textSecondary,
    icon: 'shield-outline' as const,
    features: [
      '✓ Análisis local de patrones',
      '✓ Hasta 100 reglas personalizadas',
      '✓ Historial últimos 30 días',
      '✓ Analizador WhatsApp manual',
      '✗ Claude AI en tiempo real',
      '✗ Sin anuncios',
      '✗ Lista negra actualizada',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '2,99€',
    period: '/mes',
    color: COLORS.primary,
    icon: 'shield-checkmark' as const,
    badge: 'MÁS POPULAR',
    highlight: true,
    features: [
      '✓ Todo lo del plan Gratis',
      '✓ Claude AI sin límite diario',
      '✓ Sin anuncios',
      '✓ Reglas ilimitadas',
      '✓ Historial ilimitado',
      '✓ Lista negra actualizada',
      '✗ Soporte prioritario 24h',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '7,99€',
    period: '/mes',
    color: COLORS.gold,
    icon: 'star' as const,
    features: [
      '✓ Todo lo del plan Pro',
      '✓ API key de Claude incluida',
      '✓ Soporte prioritario 24h',
      '✓ Informes PDF mensuales',
      '✓ 3 dispositivos familiares',
      '✓ Funciones anticipadas',
      '✓ Sin publicidad nunca',
    ],
  },
];

const PERKS = [
  { icon: 'flash' as const, label: 'IA en tiempo real', color: COLORS.primary },
  { icon: 'eye-off' as const, label: 'Sin anuncios', color: COLORS.success },
  { icon: 'shield-checkmark' as const, label: 'Protección total', color: COLORS.warning },
  { icon: 'people' as const, label: 'Hasta 3 dispositivos', color: COLORS.pink },
];

export default function PremiumScreen() {
  const [selected, setSelected] = useState('pro');
  const crownBounce = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(crownBounce, { toValue: -8, duration: 700, useNativeDriver: true }),
        Animated.timing(crownBounce, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const subscribe = (planId: string) => {
    if (planId === 'free') return;
    const plan = PLANS.find(p => p.id === planId)!;
    Alert.alert(
      `Activar ${plan.name}`,
      `Para el plan ${plan.name} (${plan.price}${plan.period}), integra RevenueCat o expo-in-app-purchases con tu cuenta de Google Play / App Store.\n\nEn producción esto abrirá el pago nativo de la tienda.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver guía RevenueCat →', onPress: () => Linking.openURL('https://www.revenuecat.com/docs/getting-started') },
      ]
    );
  };

  const selectedPlan = PLANS.find(p => p.id === selected)!;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeIn }}>

        {/* ── Hero ─────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroBg} />
          <Animated.View style={[styles.crownCircle, { transform: [{ translateY: crownBounce }] }]}>
            <Text style={styles.crownEmoji}>👑</Text>
          </Animated.View>
          <Text style={styles.heroTitle}>Anti-Spam IA Premium</Text>
          <Text style={styles.heroSub}>Protección total con inteligencia artificial avanzada</Text>

          {/* Perks row */}
          <View style={styles.perksRow}>
            {PERKS.map(p => (
              <View key={p.label} style={styles.perkItem}>
                <View style={[styles.perkIcon, { backgroundColor: p.color + '20' }]}>
                  <Ionicons name={p.icon} size={16} color={p.color} />
                </View>
                <Text style={styles.perkLabel}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Plan cards ───────────────────────────── */}
        {PLANS.map(plan => {
          const isSelected = selected === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && { borderColor: plan.color, borderWidth: 2 },
                plan.highlight && !isSelected && styles.planHighlight,
              ]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.8}
            >
              {plan.badge && (
                <View style={[styles.badgePill, { backgroundColor: plan.color }]}>
                  <Text style={styles.badgePillText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planTop}>
                <View style={[styles.planIconCircle, { backgroundColor: plan.color + '20', borderColor: plan.color + '40' }]}>
                  <Ionicons name={plan.icon} size={20} color={plan.color} />
                </View>
                <View style={styles.planTitleBlock}>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                    {plan.period ? <Text style={styles.planPeriod}>{plan.period}</Text> : null}
                  </View>
                </View>
                <View style={[styles.radioOuter, { borderColor: isSelected ? plan.color : COLORS.border }]}>
                  {isSelected && <View style={[styles.radioDot, { backgroundColor: plan.color }]} />}
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: isSelected ? plan.color + '30' : COLORS.border }]} />

              <View style={styles.featureList}>
                {plan.features.map((f, i) => {
                  const ok = f.startsWith('✓');
                  return (
                    <View key={i} style={styles.featureRow}>
                      <View style={[styles.featureDot, { backgroundColor: ok ? plan.color + '30' : COLORS.surface }]}>
                        <Ionicons name={ok ? 'checkmark' : 'close'} size={10} color={ok ? plan.color : COLORS.textMuted} />
                      </View>
                      <Text style={[styles.featureText, !ok && styles.featureOff]}>
                        {f.slice(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── CTA button ───────────────────────────── */}
        {selected !== 'free' && (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: selectedPlan.color }, SHADOWS.primary]}
            onPress={() => subscribe(selected)}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-open" size={20} color={selectedPlan.id === 'elite' ? '#000' : '#fff'} />
            <Text style={[styles.ctaText, { color: selectedPlan.id === 'elite' ? '#000' : '#fff' }]}>
              Activar {selectedPlan.name} · {selectedPlan.price}{selectedPlan.period}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Footer ───────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => Alert.alert('Restaurar compra', 'Disponible en la versión de producción.')}>
            <Text style={styles.restoreText}>Restaurar compra anterior</Text>
          </TouchableOpacity>
          <Text style={styles.legalText}>
            Suscripción renovada automáticamente. Cancela en cualquier momento desde los ajustes de la tienda. Precios sin IVA.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },

  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, overflow: 'hidden' },
  heroBg: {
    position: 'absolute', top: -60, width: 300, height: 300, borderRadius: 150,
    backgroundColor: COLORS.gold + '08',
  },
  crownCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.gold + '18',
    borderWidth: 1.5, borderColor: COLORS.gold + '40',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  crownEmoji: { fontSize: 38 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 18 },

  perksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.border },
  perkIcon: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  perkLabel: { fontSize: 11, color: COLORS.text, fontWeight: '600' },

  planCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 18,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  planHighlight: { borderColor: COLORS.primary + '40' },
  badgePill: {
    position: 'absolute', top: -11, right: 18,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, zIndex: 1,
  },
  badgePillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  planTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIconCircle: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  planTitleBlock: { flex: 1 },
  planName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  planPrice: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  planPeriod: { color: COLORS.textMuted, fontSize: 12 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },

  divider: { height: 1, marginBottom: 14 },
  featureList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot: { width: 18, height: 18, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1, color: COLORS.text, fontSize: 13, lineHeight: 18 },
  featureOff: { color: COLORS.textMuted },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 18, padding: 17, marginBottom: 14, marginTop: 4,
  },
  ctaText: { fontWeight: '900', fontSize: 15 },

  footer: { alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  restoreText: { color: COLORS.primary, fontSize: 13, textDecorationLine: 'underline', fontWeight: '600' },
  legalText: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 15 },
});
