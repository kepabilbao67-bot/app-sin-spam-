import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants';
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
  '¿Qué hago si me llaman del 900?',
  '¿Es peligroso abrir un enlace de SMS?',
  '¿Cómo detecta la IA el spam?',
  '¿Qué es un robocall?',
  'Explícame el phishing bancario',
];

const SYSTEM_PROMPT = `Eres el asistente IA de "Anti-Spam IA", una app española que protege de spam en llamadas, SMS y email.

Tu función:
- Responder dudas sobre spam, phishing, estafas y ciberseguridad en español
- Ayudar a entender resultados de análisis
- Dar consejos prácticos y claros
- Explicar términos técnicos de forma sencilla

Responde siempre en español. Sé conciso (máximo 3 párrafos), amigable y práctico.`;

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]));
    Animated.parallel([anim(dot1, 0), anim(dot2, 150), anim(dot3, 300)]).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 6, paddingHorizontal: 4 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[typingStyles.dot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
});

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '¡Hola! Soy tu asistente anti-spam con IA. Puedo ayudarte con spam, phishing y cómo protegerte. ¿Qué quieres saber?',
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
      if (!apiKey) throw new Error('no_key');

      const opts: ConstructorParameters<typeof Anthropic>[0] = { apiKey };
      if (Platform.OS === 'web') (opts as any).dangerouslyAllowBrowser = true;
      const client = new Anthropic(opts);

      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 450,
        system: SYSTEM_PROMPT,
        messages: [...history, { role: 'user', content: userText }],
      });

      const replyText = (response.content[0] as { text: string }).text;
      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', text: replyText, timestamp: Date.now() }]);
    } catch (e: any) {
      const isNoKey = e?.message === 'no_key';
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        text: isNoKey
          ? '🔑 Necesitas configurar tu API key de Anthropic en **Ajustes → Claude AI**. Sin ella no puedo responder preguntas personalizadas.'
          : '⚠️ Hubo un problema al conectar con la IA. Verifica tu API key en Ajustes.',
        timestamp: Date.now(),
      }]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const clearChat = () => {
    setMessages([{ id: 'welcome', role: 'assistant', text: 'Chat reiniciado. ¿En qué puedo ayudarte?', timestamp: Date.now() }]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Asistente Anti-Spam</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: hasApiKey ? COLORS.success : COLORS.warning }]} />
              <Text style={[styles.statusText, { color: hasApiKey ? COLORS.success : COLORS.warning }]}>
                {hasApiKey ? 'Claude AI conectado' : 'Sin API key — configura en Ajustes'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Ionicons name="refresh-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, idx) => (
          <View key={msg.id} style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI]}>
            {msg.role === 'assistant' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={11} color={COLORS.primary} />
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={[styles.bubbleText, msg.role === 'user' ? styles.textUser : styles.textAI]}>
                {msg.text}
              </Text>
              <Text style={styles.bubbleTime}>
                {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {msg.role === 'user' && (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={11} color="#fff" />
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={[styles.msgRow, styles.msgRowAI]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={11} color={COLORS.primary} />
            </View>
            <View style={[styles.bubble, styles.bubbleAI]}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {SUGGESTED_QUESTIONS.map(q => (
            <TouchableOpacity key={q} style={styles.chip} onPress={() => send(q)}>
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta sobre spam o phishing..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1.5, borderColor: COLORS.primary + '50',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  clearBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.cardBg },

  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10, paddingBottom: 8 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '92%' },
  msgRowUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  msgRowAI: { alignSelf: 'flex-start' },

  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary + '25',
    borderWidth: 1, borderColor: COLORS.primary + '40',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0, marginBottom: 2,
  },
  userAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0, marginBottom: 2,
  },

  bubble: { borderRadius: 18, padding: 12, maxWidth: '100%' },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  textUser: { color: '#fff' },
  textAI: { color: COLORS.text },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textAlign: 'right' },

  suggestions: { maxHeight: 52, marginBottom: 4 },
  chip: {
    backgroundColor: COLORS.cardBg, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
    maxHeight: 100, fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.primary,
  },
  sendBtnOff: { opacity: 0.35, ...{} },
});
