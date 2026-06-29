import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import BlockedItemCard from '../components/BlockedItemCard';
import { useSpamData } from '../hooks/useSpamData';
import { BlockedItem } from '../types';
import { clearAllData } from '../services/storage';
import { processSMS, processEmail, processCall } from '../services/spamDetector';

type Filter = 'all' | 'call' | 'sms' | 'email';

export default function BlockedScreen() {
  const { items, loading, refresh, deleteItem } = useSpamData();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzerInput, setAnalyzerInput] = useState('');
  const [analyzerType, setAnalyzerType] = useState<'sms' | 'call' | 'email'>('sms');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false;
    if (search && !i.sender.toLowerCase().includes(search.toLowerCase()) &&
        !(i.content?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const clearAll = () => Alert.alert('Limpiar historial', '¿Borrar todos los registros bloqueados?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar', style: 'destructive', onPress: async () => { await clearAllData(); refresh(); } },
  ]);

  const analyze = async () => {
    if (!analyzerInput.trim()) return;
    if (analyzerType === 'sms') await processSMS(analyzerInput, 'Mensaje de prueba del analizador manual');
    else if (analyzerType === 'call') await processCall(analyzerInput);
    else await processEmail(analyzerInput, 'Asunto de prueba');
    setAnalyzerInput('');
    setShowAnalyzer(false);
    refresh();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Bloqueados ({items.length})</Text>
        <TouchableOpacity onPress={clearAll}>
          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <TextInput style={styles.search} placeholder="Buscar remitente o contenido..." placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />

      <View style={styles.filters}>
        {(['all', 'call', 'sms', 'email'] as Filter[]).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'Todo' : f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showAnalyzer && (
        <View style={styles.analyzer}>
          <Text style={styles.analyzerTitle}>Analizar manualmente</Text>
          <View style={styles.typeRow}>
            {(['sms', 'call', 'email'] as const).map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, analyzerType === t && styles.typeBtnActive]} onPress={() => setAnalyzerType(t)}>
                <Text style={[styles.typeBtnText, analyzerType === t && styles.typeBtnTextActive]}>{t.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.analyzerInput} placeholder="Número o email a analizar" placeholderTextColor={COLORS.textMuted} value={analyzerInput} onChangeText={setAnalyzerInput} />
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyze}>
            <Text style={styles.analyzeBtnText}>Analizar con IA</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAnalyzer(!showAnalyzer)}>
        <Ionicons name={showAnalyzer ? 'close' : 'sparkles'} size={24} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <BlockedItemCard item={item} onDelete={deleteItem} />}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark" size={60} color={COLORS.success} />
            <Text style={styles.emptyText}>Sin spam detectado</Text>
            <Text style={styles.emptySubtext}>Tus comunicaciones están limpias</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  search: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 12, color: COLORS.text, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 10, backgroundColor: COLORS.cardBg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  analyzer: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + '44' },
  analyzerTitle: { color: COLORS.text, fontWeight: '700', marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: { flex: 1, padding: 8, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center' },
  typeBtnActive: { backgroundColor: COLORS.primary },
  typeBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  analyzerInput: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 10, color: COLORS.text, marginBottom: 10 },
  analyzeBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 10, alignItems: 'center' },
  analyzeBtnText: { color: '#fff', fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 20, zIndex: 100, width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowRadius: 8, shadowOpacity: 0.5, elevation: 8 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 13 },
});
