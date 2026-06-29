import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { BlockedItem } from '../types';
import { addRule } from '../services/storage';

interface Props {
  item: BlockedItem;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  telemarketing: 'Telemarketing',
  phishing: 'Phishing',
  scam: 'Estafa',
  robocall: 'Robot automático',
  unknown: 'Desconocido',
};

const CATEGORY_DESC: Record<string, string> = {
  telemarketing: 'Llamada o mensaje comercial no solicitado.',
  phishing: 'Intento de robo de datos personales o bancarios.',
  scam: 'Fraude o estafa para obtener dinero.',
  robocall: 'Llamada automatizada sin operador humano.',
  unknown: 'Tipo de spam no clasificado.',
};

export default function DetailScreen({ item, onClose, onDelete }: Props) {
  const confidencePct = Math.round(item.confidence * 100);
  const color = confidencePct > 85 ? COLORS.danger : confidencePct > 65 ? COLORS.warning : COLORS.primary;
  const date = new Date(item.timestamp).toLocaleString('es-ES');

  const blockSender = async () => {
    await addRule({
      id: Math.random().toString(36).substr(2, 9),
      type: 'blacklist',
      value: item.sender,
      channel: item.type === 'call' ? 'call' : item.type === 'sms' ? 'sms' : 'email',
      createdAt: Date.now(),
    });
    Alert.alert('Bloqueado', `"${item.sender}" añadido a la lista negra permanente.`);
  };

  const allowSender = async () => {
    await addRule({
      id: Math.random().toString(36).substr(2, 9),
      type: 'whitelist',
      value: item.sender,
      channel: item.type === 'call' ? 'call' : item.type === 'sms' ? 'sms' : 'email',
      createdAt: Date.now(),
    });
    onDelete(item.id);
    onClose();
    Alert.alert('Permitido', `"${item.sender}" añadido a la lista blanca. No se bloqueará más.`);
  };

  const exportItem = async () => {
    const text = `🚫 Spam detectado por Anti-Spam IA\n\nTipo: ${item.type.toUpperCase()}\nRemitente: ${item.sender}\nCategoría: ${CATEGORY_LABELS[item.category]}\nConfianza: ${confidencePct}%\nRazón: ${item.reason}\nFecha: ${date}${item.content ? `\nContenido: "${item.content}"` : ''}`;
    await Share.share({ message: text });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={[styles.typeCircle, { backgroundColor: color + '22' }]}>
            <Ionicons name={item.type === 'call' ? 'call' : item.type === 'sms' ? 'chatbubble' : 'mail'} size={24} color={color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.sender} numberOfLines={1}>{item.sender}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body}>
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceBar]}>
              <View style={[styles.confidenceFill, { width: `${confidencePct}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={[styles.confidenceText, { color }]}>{confidencePct}% spam</Text>
          </View>

          <View style={[styles.categoryCard, { borderColor: color + '44' }]}>
            <Text style={[styles.categoryLabel, { color }]}>{CATEGORY_LABELS[item.category]}</Text>
            <Text style={styles.categoryDesc}>{CATEGORY_DESC[item.category]}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Razón del bloqueo</Text>
            <Text style={styles.reason}>{item.reason}</Text>
          </View>

          {item.content && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contenido</Text>
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>{item.content}</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.danger + '66' }]} onPress={blockSender}>
              <Ionicons name="ban" size={18} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Bloquear siempre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.success + '66' }]} onPress={allowSender}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={[styles.actionText, { color: COLORS.success }]}>Era legítimo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={exportItem}>
            <Ionicons name="share-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.shareText}>Compartir evidencia</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000000BB', zIndex: 200, justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '85%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  typeCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  sender: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  date: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { paddingHorizontal: 16 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  confidenceBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.cardBg, overflow: 'hidden' },
  confidenceFill: { height: 8, borderRadius: 4 },
  confidenceText: { fontSize: 14, fontWeight: '800', minWidth: 64, textAlign: 'right' },
  categoryCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  categoryLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  categoryDesc: { color: COLORS.textSecondary, fontSize: 12 },
  section: { marginBottom: 14 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: '700' },
  reason: { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  contentBox: { backgroundColor: COLORS.cardBg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  contentText: { color: COLORS.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, borderWidth: 1 },
  actionText: { fontWeight: '700', fontSize: 13 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  shareText: { color: COLORS.textSecondary, fontSize: 13 },
});
