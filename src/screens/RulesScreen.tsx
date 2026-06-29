import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useSpamData } from '../hooks/useSpamData';
import { Rule } from '../types';

export default function RulesScreen() {
  const { rules, loading, refresh, createRule, deleteRule } = useSpamData();
  const [modal, setModal] = useState(false);
  const [value, setValue] = useState('');
  const [type, setType] = useState<Rule['type']>('blacklist');
  const [channel, setChannel] = useState<Rule['channel']>('all');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (type === 'pattern') {
      try { new RegExp(trimmed); } catch {
        Alert.alert('Expresión inválida', 'La expresión regular no es válida. Corrígela e inténtalo de nuevo.');
        return;
      }
    }
    const rule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: trimmed,
      channel,
      createdAt: Date.now(),
    };
    await createRule(rule);
    setValue('');
    setModal(false);
  };

  const del = (id: string) => Alert.alert('Eliminar regla', '¿Eliminar esta regla?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => deleteRule(id) },
  ]);

  const typeColor = { whitelist: COLORS.success, blacklist: COLORS.danger, pattern: COLORS.warning };
  const typeLabel = { whitelist: 'Permitir', blacklist: 'Bloquear', pattern: 'Patrón' };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Reglas ({rules.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Nueva regla</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legend}><View style={[styles.dot, { backgroundColor: COLORS.success }]} /><Text style={styles.legendText}>Lista blanca = siempre permitir</Text></View>
        <View style={styles.legend}><View style={[styles.dot, { backgroundColor: COLORS.danger }]} /><Text style={styles.legendText}>Lista negra = siempre bloquear</Text></View>
        <View style={styles.legend}><View style={[styles.dot, { backgroundColor: COLORS.warning }]} /><Text style={styles.legendText}>Patrón = expresión regular</Text></View>
      </View>

      <FlatList
        data={rules}
        keyExtractor={r => r.id}
        refreshing={loading}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <View style={styles.ruleCard}>
            <View style={[styles.ruleType, { backgroundColor: typeColor[item.type] + '22' }]}>
              <Text style={[styles.ruleTypeText, { color: typeColor[item.type] }]}>{typeLabel[item.type]}</Text>
            </View>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleValue}>{item.value}</Text>
              <Text style={styles.ruleMeta}>{item.channel === 'all' ? 'Todos los canales' : item.channel.toUpperCase()} · {new Date(item.createdAt).toLocaleDateString('es-ES')}</Text>
            </View>
            <TouchableOpacity onPress={() => del(item.id)}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="filter" size={50} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Sin reglas personalizadas</Text>
            <Text style={styles.emptySubtext}>Añade números, emails o patrones para bloquear o permitir</Text>
          </View>
        }
      />

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva regla</Text>

            <Text style={styles.label}>Tipo de regla</Text>
            <View style={styles.optionRow}>
              {(['whitelist', 'blacklist', 'pattern'] as const).map(t => (
                <TouchableOpacity key={t} style={[styles.optionBtn, type === t && { backgroundColor: typeColor[t] }]} onPress={() => setType(t)}>
                  <Text style={[styles.optionText, type === t && { color: '#fff' }]}>{typeLabel[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Canal</Text>
            <View style={styles.optionRow}>
              {(['all', 'call', 'sms', 'email'] as const).map(c => (
                <TouchableOpacity key={c} style={[styles.optionBtn, channel === c && styles.optionBtnActive]} onPress={() => setChannel(c)}>
                  <Text style={[styles.optionText, channel === c && { color: '#fff' }]}>{c === 'all' ? 'Todo' : c.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{type === 'pattern' ? 'Expresión regular' : 'Número / Email / Dominio'}</Text>
            <TextInput style={styles.input} value={value} onChangeText={setValue} placeholder={type === 'pattern' ? 'ej: \\+34900.*' : 'ej: +34900123456'} placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  legendRow: { gap: 4, marginBottom: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  ruleCard: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  ruleType: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ruleTypeText: { fontSize: 11, fontWeight: '700' },
  ruleInfo: { flex: 1 },
  ruleValue: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  ruleMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.cardBg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  optionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 14, color: COLORS.text, marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.cardBg, alignItems: 'center' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '700' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
