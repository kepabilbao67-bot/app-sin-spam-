import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function AdBanner() {
  return (
    <TouchableOpacity style={styles.container} onPress={() => Linking.openURL('https://www.revenuecat.com/docs/getting-started')} activeOpacity={0.8}>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>PUBLICIDAD</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="megaphone" size={20} color={COLORS.textMuted} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.headline}>¿Cansado de los anuncios?</Text>
          <Text style={styles.sub}>Hazte Premium y elimínalos para siempre</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={22} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.surface, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  adLabel: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  adLabelText: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.cardBg, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  headline: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  sub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
});
