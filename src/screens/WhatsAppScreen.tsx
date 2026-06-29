import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Share, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { analyzeLocally, analyzeWithAI, isAIReady } from '../services/aiAnalyzer';
import { addBlockedItem } from '../services/storage';
import { AIAnalysis } from '../types';

const WHATSAPP_SPAM_TIPS = [
  'Cuidado con mensajes que piden datos bancarios o contraseñas',
  'Los sorteos y premios por WhatsApp son casi siempre fraudes',
  'No pulses enlaces de remitentes desconocidos',
  'Los mensajes "reenvía a 10 contactos" suelen ser bulos',
  'Desconfía de ofertas de trabajo con pagos por adelantado',
];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function WhatsAppScreen() {
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysis | null>(null);
  const [saved, setSaved] = useState(false);

  // Handle incoming shared text from WhatsApp (Android share intent)
  useEffect(() => {
    const handleUrl = (url: string) => {
      if (url?.startsWith('share:')) {
        const shared = decodeURIComponent(url.replace('share:', ''));
        setMessage(shared);
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const analyze = async () => {
    if (!message.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setSaved(false);
    const senderVal = sender.trim() || 'WhatsApp desconocido';
    const res = isAIReady()
      ? await analyzeWithAI(senderVal, message.trim(), 'sms')
      : analyzeLocally(senderVal, message.trim(), 'sms');
    setResult(res);
    setAnalyzing(false);
  };

  const saveToHistory = async () => {
    if (!result) return;
    await addBlockedItem({
      id: generateId(),
      type: 'sms',
      sender: sender.trim() || 'WhatsApp desconocido',
      content: message.substring(0, 200),
      timestamp: Date.now(),
      category: result.category,
      confidence: result.confidence,
      blocked: result.isSpam,
      reason: result.reason,
    });
    setSaved(true);
    Alert.alert('Guardado', 'El análisis se añadió al historial de bloqueados.');
  };

  const shareResult = async () => {
    if (!result) return;
    await Share.share({
      message: `🔍 Análisis Anti-Spam IA\n\nMensaje: "${message.substring(0, 100)}..."\n\n${result.isSpam ? '🚫 SPAM DETECTADO' : '✅ Parece legítimo'}\nConfianza: ${Math.round(result.confidence * 100)}%\nCategoría: ${result.category}\nRazón: ${result.reason}`,
    });
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const resultColor = !result ? COLORS.primary
    : result.isSpam
      ? (confidencePct > 85 ? COLORS.danger : COLORS.warning)
      : COLORS.success;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.waIcon}>
          <Text style={styles.waEmoji}>💬</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Analizador WhatsApp</Text>
          <Text style={styles.subtitle}>Pega aquí mensajes sospechosos</Text>
        </View>
      </View>

      {/* How to use */}
      <View style={styles.howTo}>
        <Text style={styles.howToTitle}>Cómo usarlo</Text>
        <View style={styles.step}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={styles.stepText}>En WhatsApp, mantén pulsado el mensaje sospechoso</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={styles.stepText}>Pulsa "Compartir" → selecciona "Anti-Spam IA"</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
          <Text style={styles.stepText}>O copia y pega el texto aquí manualmente</Text>
        </View>
      </View>

      {/* Input */}
      <View style={styles.card}>
        <Text style={styles.label}>Remitente (opcional)</Text>
        <TextInput
          style={styles.input}
          value={sender}
          onChangeText={setSender}
          placeholder="+34 600 000 000 o nombre"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Mensaje a analizar</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Pega aquí el mensaje sospechoso de WhatsApp..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.analyzeBtn, (!message.trim() || analyzing) && { opacity: 0.5 }]}
          onPress={analyze}
          disabled={!message.trim() || analyzing}
        >
          {analyzing
            ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.analyzeBtnText}>Analizando con IA...</Text></>
            : <><Ionicons name="search" size={18} color="#fff" /><Text style={styles.analyzeBtnText}>Analizar mensaje</Text></>
          }
        </TouchableOpacity>
      </View>

      {/* Result */}
      {result && (
        <View style={[styles.resultCard, { borderColor: resultColor + '66' }]}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={result.isSpam ? 'warning' : 'checkmark-circle'}
              size={28}
              color={resultColor}
            />
            <Text style={[styles.resultTitle, { color: resultColor }]}>
              {result.isSpam ? '🚫 SPAM DETECTADO' : '✅ Parece legítimo'}
            </Text>
          </View>

          <View style={styles.confidenceRow}>
            <View style={styles.confidenceTrack}>
              <View style={[styles.confidenceFill, { width: `${confidencePct}%` as any, backgroundColor: resultColor }]} />
            </View>
            <Text style={[styles.confidencePct, { color: resultColor }]}>{confidencePct}%</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: resultColor + '22' }]}>
              <Text style={[styles.badgeText, { color: resultColor }]}>{result.category}</Text>
            </View>
          </View>

          <Text style={styles.reasonText}>{result.reason}</Text>

          <View style={styles.resultActions}>
            {result.isSpam && !saved && (
              <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.danger + '66' }]} onPress={saveToHistory}>
                <Ionicons name="save-outline" size={16} color={COLORS.danger} />
                <Text style={[styles.actionText, { color: COLORS.danger }]}>Guardar en historial</Text>
              </TouchableOpacity>
            )}
            {saved && (
              <View style={[styles.actionBtn, { borderColor: COLORS.success + '66' }]}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={[styles.actionText, { color: COLORS.success }]}>Guardado</Text>
              </View>
            )}
            <TouchableOpacity style={[styles.actionBtn, { borderColor: COLORS.primary + '66' }]} onPress={shareResult}>
              <Ionicons name="share-outline" size={16} color={COLORS.primary} />
              <Text style={[styles.actionText, { color: COLORS.primary }]}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={styles.card}>
        <Text style={styles.tipsTitle}>Consejos de seguridad en WhatsApp</Text>
        {WHATSAPP_SPAM_TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, marginTop: 8 },
  waIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#25D366' + '33', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#25D366' + '55' },
  waEmoji: { fontSize: 26 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  howTo: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  howToTitle: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary + '33', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stepNumText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, color: COLORS.text, fontSize: 13, lineHeight: 18 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  textArea: { minHeight: 110, lineHeight: 20 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, marginTop: 4 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resultCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resultTitle: { fontSize: 17, fontWeight: '800' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  confidenceTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.surface, overflow: 'hidden' },
  confidenceFill: { height: 8, borderRadius: 4 },
  confidencePct: { fontSize: 14, fontWeight: '800', minWidth: 40, textAlign: 'right' },
  metaRow: { flexDirection: 'row', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  reasonText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  resultActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  actionText: { fontWeight: '700', fontSize: 12 },
  tipsTitle: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tipText: { flex: 1, color: COLORS.text, fontSize: 12, lineHeight: 18 },
});
