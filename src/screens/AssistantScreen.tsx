import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { isAIReady } from '../services/aiAnalyzer';
import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '../services/storage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const SUGGESTED_QUESTIONS = [
  '¿Cómo sé si un SMS es phishing?',
  '¿Qué hago si recibo una llamada de spam?',
  '¿Es peligroso abrir un enlace de SMS?',
  '¿Cómo funciona la detección con IA?',
  '¿Qué es un robocall?',
  'Explícame las categorías de spam',
];

const SYSTEM_PROMPT = `Eres el asistente IA de "Anti-Spam IA", una app móvil española que protege a los usuarios de spam en llamadas, SMS, WhatsApp y email.

Tu función es:
- Responder dudas sobre spam, phishing, estafas y ciberseguridad en español
- Ayudar a entender los resultados de análisis de la app
- Dar consejos prácticos y claros para protegerse
- Explicar términos técnicos de forma sencilla
- Orientar sobre qué hacer cuando se recibe spam o se es víctima de fraude

Responde siempre en español. Sé conciso (máximo 3-4 párrafos), amigable y práctico. Si no estás seguro de algo, dilo claramente. No inventes información sobre empresas o números específicos.`;

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Soy tu asistente anti-spam con IA. Puedo ayudarte a entender el spam, el phishing y cómo protegerte. ¿Qué quieres saber?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    getApiKey().then(k => setHasApiKey(!!k));
  }, []));

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg: Message = { id: generateId(), role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('no_key');
      }

      const opts: ConstructorParameters<typeof Anthropic>[0] = { apiKey };
      if (Platform.OS === 'web') (opts as any).dangerouslyAllowBrowser = true;
      const client = new Anthropic(opts);

      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [...history, { role: 'user', content: userText }],
      });

      const replyText = (response.content[0] as { text: string }).text;
      const assistantMsg: Message = { id: generateId(), role: 'assistant', text: replyText, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const isNoKey = e?.message === 'no_key';
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        text: isNoKey
          ? 'Para usar el asistente necesitas configurar tu API key de Claude en Ajustes → Claude AI (opcional). Sin ella puedo ayudarte con información básica, pero no podré responder preguntas personalizadas.'
          : 'Lo siento, hubo un problema al conectar con la IA. Verifica tu API key en Ajustes.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      text: '¡Chat limpiado! ¿En qué puedo ayudarte?',
      timestamp: Date.now(),
    }]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiDot} />
          <View>
            <Text style={styles.headerTitle}>Asistente IA</Text>
            <Text style={styles.headerStatus}>
              {hasApiKey ? 'Claude AI conectado' : 'Configura tu API key para activar'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {!hasApiKey && (
        <View style={styles.noBanner}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
          <Text style={styles.noBannerText}>Sin API key el asistente responde con información básica. Configúrala en Ajustes.</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {msg.role === 'assistant' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={12} color={COLORS.primary} />
              </View>
            )}
            <View style={[styles.bubbleContent, msg.role === 'user' ? styles.userContent : styles.aiContent]}>
              <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userText : styles.aiText]}>
                {msg.text}
              </Text>
              <Text style={styles.bubbleTime}>
                {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={12} color={COLORS.primary} />
            </View>
            <View style={[styles.bubbleContent, styles.aiContent, styles.typingBubble]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>Pensando...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {SUGGESTED_QUESTIONS.map(q => (
            <TouchableOpacity key={q} style={styles.suggestionChip} onPress={() => send(q)}>
              <Text style={styles.suggestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta sobre spam, phishing..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  headerTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  headerStatus: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  clearBtn: { padding: 6 },
  noBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '18', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.warning + '33' },
  noBannerText: { flex: 1, color: COLORS.warning, fontSize: 11, lineHeight: 16 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary + '33', justifyContent: 'center', alignItems: 'center', marginBottom: 4, flexShrink: 0 },
  bubbleContent: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userContent: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiContent: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  aiText: { color: COLORS.text },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  typingText: { color: COLORS.textMuted, fontSize: 13 },
  suggestions: { maxHeight: 50, marginBottom: 4 },
  suggestionChip: { backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  suggestionText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  input: { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, maxHeight: 100, fontSize: 14 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
