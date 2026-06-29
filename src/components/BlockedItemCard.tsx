import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlockedItem } from '../types';
import { COLORS } from '../constants';

interface Props {
  item: BlockedItem;
  onDelete: (id: string) => void;
  onPress?: (item: BlockedItem) => void;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  telemarketing: { label: 'Telemarketing', color: COLORS.warning, icon: 'megaphone' },
  phishing: { label: 'Phishing', color: COLORS.danger, icon: 'fish' },
  scam: { label: 'Estafa', color: '#FF4081', icon: 'alert-circle' },
  robocall: { label: 'Robocall', color: '#7C4DFF', icon: 'hardware-chip' },
  unknown: { label: 'Desconocido', color: COLORS.textMuted, icon: 'help-circle' },
};

const TYPE_META: Record<string, { icon: string; label: string }> = {
  call: { icon: 'call', label: 'Llamada' },
  sms: { icon: 'chatbubble', label: 'SMS' },
  email: { icon: 'mail', label: 'Email' },
};

export default function BlockedItemCard({ item, onDelete, onPress }: Props) {
  const confidencePct = Math.round(item.confidence * 100);
  const cat = CATEGORY_META[item.category] ?? CATEGORY_META.unknown;
  const type = TYPE_META[item.type] ?? { icon: 'alert', label: 'Otro' };
  const accentColor = cat.color;
  const date = new Date(item.timestamp).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const confirm = () => Alert.alert('Eliminar registro', '¿Eliminar este elemento?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(item.id) },
  ]);

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: accentColor }]} onPress={() => onPress?.(item)} activeOpacity={0.75}>
      {/* Left accent + icon */}
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Ionicons name={type.icon as any} size={18} color={accentColor} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.sender} numberOfLines={1}>{item.sender}</Text>
          <View style={[styles.catBadge, { backgroundColor: accentColor + '22' }]}>
            <Ionicons name={cat.icon as any} size={10} color={accentColor} />
            <Text style={[styles.catText, { color: accentColor }]}>{cat.label}</Text>
          </View>
        </View>

        {item.content && (
          <Text style={styles.preview} numberOfLines={1}>{item.content}</Text>
        )}

        {/* Confidence bar */}
        <View style={styles.barRow}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${confidencePct}%` as any, backgroundColor: accentColor }]} />
          </View>
          <Text style={[styles.confText, { color: accentColor }]}>{confidencePct}%</Text>
        </View>

        <Text style={styles.date}>{date} · {type.label}</Text>
      </View>

      <TouchableOpacity onPress={confirm} style={styles.deleteBtn}>
        <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sender: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  catText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  preview: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 15 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.surface, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  confText: { fontSize: 11, fontWeight: '800', width: 32, textAlign: 'right' },
  date: { fontSize: 10, color: COLORS.textMuted },
  deleteBtn: { padding: 2, flexShrink: 0 },
});
