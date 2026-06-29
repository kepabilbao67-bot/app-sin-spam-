import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlockedItem } from '../types';
import { COLORS } from '../constants';

interface Props {
  item: BlockedItem;
  onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  telemarketing: 'Telemarketing',
  phishing: 'Phishing',
  scam: 'Estafa',
  robocall: 'Robot',
  unknown: 'Desconocido',
};

const TYPE_ICONS: Record<string, string> = {
  call: 'call',
  sms: 'chatbubble',
  email: 'mail',
  app: 'apps',
};

export default function BlockedItemCard({ item, onDelete }: Props) {
  const confidencePct = Math.round(item.confidence * 100);
  const color = confidencePct > 85 ? COLORS.danger : confidencePct > 65 ? COLORS.warning : COLORS.primary;
  const date = new Date(item.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const confirm = () => Alert.alert('Eliminar registro', '¿Eliminar este elemento bloqueado?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(item.id) },
  ]);

  return (
    <View style={styles.card}>
      <View style={[styles.typeIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={TYPE_ICONS[item.type] as any} size={18} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.sender} numberOfLines={1}>{item.sender}</Text>
        {item.content && <Text style={styles.content} numberOfLines={1}>{item.content}</Text>}
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: color + '33' }]}>
            <Text style={[styles.badgeText, { color }]}>{CATEGORY_LABELS[item.category]}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.reason}>{item.reason}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.confidence, { color }]}>{confidencePct}%</Text>
        <TouchableOpacity onPress={confirm} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  typeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  sender: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  content: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  date: { fontSize: 10, color: COLORS.textMuted },
  reason: { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' },
  right: { alignItems: 'center', gap: 8, marginLeft: 8 },
  confidence: { fontSize: 16, fontWeight: '800' },
  deleteBtn: { padding: 4 },
});
