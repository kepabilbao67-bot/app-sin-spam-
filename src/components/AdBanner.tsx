import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default function AdBanner() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => Linking.openURL('https://www.revenuecat.com/docs/getting-started')}
      activeOpacity={0.85}
    >
      <View style={styles.adTag}>
        <Text style={styles.adTagText}>AD</Text>
      </View>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Ionicons name="rocket" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.headline}>Hazte Premium · Sin anuncios</Text>
          <Text style={styles.sub}>Análisis con Claude AI ilimitado desde 2,99€/mes</Text>
        </View>
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 14,
    marginHorizontal: 0,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    overflow: 'hidden',
  },
  adTag: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  adTagText: { color: COLORS.primaryLight, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  textBlock: { flex: 1 },
  headline: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  sub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
  arrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
});
