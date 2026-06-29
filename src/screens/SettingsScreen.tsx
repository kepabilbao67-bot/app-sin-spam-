import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, DEFAULT_SETTINGS } from '../constants';
import { useSpamData } from '../hooks/useSpamData';
import { AppSettings } from '../types';
import { initAI, testAIConnection } from '../services/aiAnalyzer';

export default function SettingsScreen() {
  const { settings, refresh, updateSettings } = useSpamData();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (!settings) return null;

  const toggle = async (key: keyof AppSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    await updateSettings(updated);
  };

  const setSlider = async (key: keyof AppSettings, value: number) => {
    const updated = { ...settings, [key]: value };
    await updateSettings(updated);
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    initAI(apiKey.trim());
    const result = await testAIConnection();
    setTesting(false);
    if (result.ok) {
      await updateSettings({ ...settings, apiKey: apiKey.trim() });
      Alert.alert('Claude AI conectado', `Conexión exitosa.\nModelo: ${result.model}\n\nEl análisis de spam ahora usa IA real.`);
      setApiKey('');
    } else {
      Alert.alert('Error de conexión', `No se pudo conectar:\n${result.error}\n\nVerifica que la API key sea correcta.`);
    }
  };

  const resetSettings = () => Alert.alert('Restablecer', '¿Volver a la configuración predeterminada?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Restablecer', style: 'destructive', onPress: async () => { await updateSettings(DEFAULT_SETTINGS); } },
  ]);

  const SwitchRow = ({ label, desc, settingKey, icon, color = COLORS.primary }: { label: string; desc: string; settingKey: keyof AppSettings; icon: string; color?: string }) => (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={!!settings[settingKey]}
        onValueChange={() => toggle(settingKey)}
        trackColor={{ false: COLORS.border, true: color + '88' }}
        thumbColor={settings[settingKey] ? color : COLORS.textMuted}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <Text style={styles.section}>Protección</Text>
      <View style={styles.card}>
        <SwitchRow label="Bloquear llamadas" desc="Filtrar llamadas de spam y robocalls" settingKey="callBlockingEnabled" icon="call" color={COLORS.danger} />
        <View style={styles.divider} />
        <SwitchRow label="Filtrar SMS" desc="Analizar y bloquear mensajes de texto" settingKey="smsFilteringEnabled" icon="chatbubble" color={COLORS.warning} />
        <View style={styles.divider} />
        <SwitchRow label="Filtrar emails" desc="Detectar phishing y spam en email" settingKey="emailFilteringEnabled" icon="mail" color={COLORS.primary} />
        <View style={styles.divider} />
        <SwitchRow label="Bloquear internacionales" desc="Bloquear llamadas de fuera de España" settingKey="blockInternational" icon="earth" color={COLORS.textSecondary} />
      </View>

      <Text style={styles.section}>Inteligencia Artificial</Text>
      <View style={styles.card}>
        <SwitchRow label="Análisis IA activo" desc="Usar IA para detectar spam nuevo" settingKey="aiAnalysisEnabled" icon="sparkles" color={COLORS.primary} />
        <View style={styles.divider} />
        <SwitchRow label="Bloqueo automático" desc="Bloquear automáticamente si IA detecta spam" settingKey="autoBlockHighConfidence" icon="shield" color={COLORS.success} />

        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Umbral de confianza: <Text style={{ color: COLORS.primary }}>{Math.round((settings.confidenceThreshold || 0.75) * 100)}%</Text></Text>
          <View style={styles.thresholdBtns}>
            {[0.5, 0.65, 0.75, 0.9].map(v => (
              <TouchableOpacity key={v} style={[styles.thresholdBtn, settings.confidenceThreshold === v && styles.thresholdBtnActive]} onPress={() => setSlider('confidenceThreshold', v)}>
                <Text style={[styles.thresholdBtnText, settings.confidenceThreshold === v && { color: '#fff' }]}>{Math.round(v * 100)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.section}>Claude AI (opcional)</Text>
      <View style={styles.card}>
        <Text style={styles.apiDesc}>Conecta tu API key de Anthropic para análisis más preciso con Claude AI. Sin API key, funciona el análisis local de patrones.</Text>
        {settings.apiKey && (
          <View style={styles.apiStatus}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.apiStatusText}>Claude AI conectado</Text>
          </View>
        )}
        <View style={styles.apiRow}>
          <TextInput
            style={styles.apiInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-ant-..."
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeBtn}>
            <Ionicons name={showKey ? 'eye-off' : 'eye'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.saveKeyBtn, testing && { opacity: 0.6 }]} onPress={saveApiKey} disabled={testing}>
          {testing
            ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.saveKeyText}>Probando conexión...</Text></>
            : <Text style={styles.saveKeyText}>Guardar y probar conexión</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/')}>
          <Text style={styles.getKeyLink}>Obtener API key en console.anthropic.com →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Notificaciones</Text>
      <View style={styles.card}>
        <SwitchRow label="Notificaciones" desc="Alertar cuando se bloquea algo" settingKey="notificationsEnabled" icon="notifications" color={COLORS.warning} />
      </View>

      <Text style={styles.section}>Cómo usar en tu móvil</Text>
      <View style={styles.card}>
        {[
          { n: '1', text: 'Instala "Expo Go" desde Play Store o App Store' },
          { n: '2', text: 'En tu ordenador: npm install && npm start' },
          { n: '3', text: 'Escanea el QR con Expo Go' },
          { n: '4', text: 'Para publicar en tiendas: eas build --platform android' },
        ].map(step => (
          <View key={step.n} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{step.n}</Text></View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.storeLink} onPress={() => Linking.openURL('https://expo.dev/go')}>
          <Ionicons name="open-outline" size={14} color={COLORS.primary} />
          <Text style={styles.storeLinkText}>Abrir expo.dev/go →</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={resetSettings}>
        <Ionicons name="refresh" size={16} color={COLORS.danger} />
        <Text style={styles.resetText}>Restablecer configuración</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Anti-Spam IA v1.0.0</Text>
        <Text style={styles.footerText}>Protección local + Claude AI</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 20, marginTop: 8 },
  section: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  rowDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },
  thresholdRow: { padding: 14 },
  thresholdLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  thresholdBtns: { flexDirection: 'row', gap: 8 },
  thresholdBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.surface, alignItems: 'center' },
  thresholdBtnActive: { backgroundColor: COLORS.primary },
  thresholdBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  apiDesc: { color: COLORS.textSecondary, fontSize: 12, padding: 14, lineHeight: 18 },
  apiStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, marginBottom: 8 },
  apiStatusText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  apiRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginBottom: 10 },
  apiInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  eyeBtn: { padding: 12 },
  saveKeyBtn: { marginHorizontal: 14, backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveKeyText: { color: '#fff', fontWeight: '700' },
  getKeyLink: { color: COLORS.primary, fontSize: 12, textAlign: 'center', padding: 8, marginBottom: 6, textDecorationLine: 'underline' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, backgroundColor: COLORS.danger + '22', marginTop: 16, borderWidth: 1, borderColor: COLORS.danger + '44' },
  resetText: { color: COLORS.danger, fontWeight: '700' },
  footer: { alignItems: 'center', padding: 24, gap: 4 },
  footerText: { color: COLORS.textMuted, fontSize: 11 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary + '33', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, color: COLORS.text, fontSize: 13 },
  storeLink: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginTop: 4 },
  storeLinkText: { color: COLORS.primary, fontSize: 13, textDecorationLine: 'underline' },
});
