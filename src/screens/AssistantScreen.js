import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { loadCollection } from '../services/storage';
import { TOTAL_STICKERS, STICKER_BY_ID } from '../data/stickerCatalog';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { TOTAL_ADRENALYN } from '../data/adrenalynCatalog';
import AppIcon from '../components/AppIcon';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

// Suggestions via i18n (see below in component)

async function askClaude(userMessage, collection, lang = 'de') {
  const have    = collection.have ?? [];
  const owned   = have.length;
  const missing = TOTAL_STICKERS - owned;

  // Fehlende Sticker-IDs mit Team-Infos aufbauen
  const allIds = Object.keys(STICKER_BY_ID);
  const missingIds = allIds.filter(id => !have.includes(id));

  // Gruppiere fehlende nach Team für kompakte Darstellung
  const missingByTeam = {};
  for (const id of missingIds) {
    const s = STICKER_BY_ID[id];
    if (!s) continue;
    const team = s.team ?? s.type ?? 'other';
    if (!missingByTeam[team]) missingByTeam[team] = [];
    missingByTeam[team].push(id);
  }
  const missingStr = Object.entries(missingByTeam)
    .map(([team, ids]) => `${team}: ${ids.join(',')}`)
    .join(' | ');

  // Doppelte
  const duplicates = Object.entries(collection.duplicates ?? {})
    .filter(([, count]) => count > 1)
    .map(([id, count]) => `${id}(${count}x)`)
    .join(', ');

  const LANG_INSTRUCTIONS = {
    de: 'Antworte immer auf Deutsch in kurzem Markdown (max. 150 Wörter). Nutze # für Überschriften, **fett** für Schlüsselwörter, - für Listen.',
    en: 'Always respond in English in brief Markdown (max. 150 words). Use # for headings, **bold** for key terms, - for lists.',
    es: 'Responde siempre en español en Markdown breve (máx. 150 palabras). Usa # para títulos, **negrita** para términos clave, - para listas.',
    pt: 'Responda sempre em português em Markdown breve (máx. 150 palavras). Use # para títulos, **negrito** para termos-chave, - para listas.',
    fr: 'Réponds toujours en français en Markdown court (max. 150 mots). Utilise # pour les titres, **gras** pour les termes clés, - pour les listes.',
  };
  const langInstruction = LANG_INSTRUCTIONS[lang] ?? LANG_INSTRUCTIONS.en;

  const systemPrompt = `You are StickerScout, the personal collection assistant for the WM 2026 sticker and trading card collection.
${langInstruction}

SAMMLUNG DES NUTZERS:
- Sticker: ${owned}/${TOTAL_STICKERS} vorhanden (${missing} fehlen)
- Vorhandene IDs: ${have.slice(0,50).join(',')}${have.length > 50 ? '...' : ''}
- Fehlende Sticker: ${missingStr}
- Doppelte: ${duplicates || 'keine'}

GRUPPEN: A(MEX,RSA,KOR,CZE) B(CAN,BIH,QAT,SUI) C(BRA,MAR,HAI,SCO) D(USA,PAR,AUS,TUR) E(GER,CUW,CIV,ECU) F(NED,JPN,SWE,TUN) G(BEL,EGY,IRN,NZL) H(ESP,CPV,KSA,URU) I(FRA,SEN,IRQ,NOR) J(ARG,ALG,AUT,JOR) K(POR,COD,UZB,COL) L(ENG,CRO,GHA,PAN)
ÖSTERREICH (AUT): Gruppe J — Spiele: 17.06. vs JOR, 22.06. vs ARG, 28.06. vs ALG`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5',
      max_tokens: 400,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API Error ${response.status}`);
  }
  const data = await response.json();
  return data.content[0].text;
}

export default function AssistantScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const suggestions = [t('assistant.suggestions.1'), t('assistant.suggestions.2'), t('assistant.suggestions.3'), t('assistant.suggestions.4'), t('assistant.suggestions.5')];
  // isGreeting:true → Text wird zur Render-Zeit aus i18n gezogen (nie hartkodiert)
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', isGreeting: true }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [collection, setCollection] = useState({ have: [] });
  const listRef = useRef(null);

  useFocusEffect(useCallback(() => { loadCollection().then(setCollection); }, []));

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await askClaude(msg, collection, i18n.language);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'a', role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'e', role: 'assistant',
        text: `⚠️ ${t('assistant.error')}`,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ {t('assistant.title')}</Text>
        <Text style={styles.headerSub}>{t('assistant.subtitle')}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const bubbleText = item.isGreeting ? t('assistant.greeting') : (item.text ?? '');
          const isUser = item.role === 'user';
          return (
            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
              {!isUser && (
                <View style={styles.botAvatar}><Text style={styles.botAvatarText}>🏆</Text></View>
              )}
              <View style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
                {isUser ? (
                  <Text style={[styles.msgText, styles.msgTextUser]}>{bubbleText}</Text>
                ) : (
                  <MarkdownText text={bubbleText} baseStyle={styles.msgText} />
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={loading ? (
          <View style={styles.loadingRow}>
            <View style={styles.botAvatar}><Text style={styles.botAvatarText}>🏆</Text></View>
            <View style={styles.bubbleTextBot}>
              <ActivityIndicator size="small" color={COLORS.gold} />
            </View>
          </View>
        ) : null}
      />

      {/* Suggestions */}
      {messages.length <= 1 && (
        <FlatList
          horizontal
          data={suggestions}
          keyExtractor={s => s}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.suggestions}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestion} onPress={() => send(item)}>
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('assistant.placeholder')}
          placeholderTextColor={COLORS.textSecondary}
          multiline
          maxLength={300}
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color={input.trim() && !loading ? COLORS.textOnGold : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Lightweight Markdown Renderer — kein externes Package
// Unterstützt: # H1, ## H2, **fett**, - Listen, leere Zeilen, Emojis
// ---------------------------------------------------------------------------

/** Inline-Parser: **fett** → <Text bold> */
function parseInline(text, baseStyle, boldStyle) {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={boldStyle}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i} style={baseStyle}>{part}</Text>;
  });
}

function MarkdownText({ text, baseStyle }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, idx) => {
        // H1
        if (/^#\s+/.test(line)) {
          return (
            <Text key={idx} style={mdStyles.h1}>
              {line.replace(/^#+\s*/, '')}
            </Text>
          );
        }
        // H2
        if (/^##\s+/.test(line)) {
          return (
            <Text key={idx} style={mdStyles.h2}>
              {line.replace(/^#+\s*/, '')}
            </Text>
          );
        }
        // Bullet -/*/•
        if (/^[-*•]\s+/.test(line)) {
          return (
            <View key={idx} style={mdStyles.bulletRow}>
              <Text style={mdStyles.bullet}>{'· '}</Text>
              <Text style={{ flex: 1, flexWrap: 'wrap' }}>
                {parseInline(line.replace(/^[-*•]\s+/, ''), baseStyle, mdStyles.bold)}
              </Text>
            </View>
          );
        }
        // Leerzeile
        if (line.trim() === '') {
          return <View key={idx} style={{ height: 6 }} />;
        }
        // Normaler Absatz
        return (
          <Text key={idx} style={mdStyles.paragraph}>
            {parseInline(line, baseStyle, mdStyles.bold)}
          </Text>
        );
      })}
    </View>
  );
}

const mdStyles = StyleSheet.create({
  h1: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 6,
  },
  h2: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    marginBottom: 3,
    marginTop: 5,
  },
  bold: {
    color: '#fff',
    fontWeight: '700',
  },
  paragraph: {
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  bullet: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    padding: SPACING.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  headerTitle: { color: COLORS.gold, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerSub:   { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },

  list: { padding: SPACING.md, paddingBottom: SPACING.lg },

  bubble: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  bubbleUser: { flexDirection: 'row-reverse' },
  bubbleBot:  { flexDirection: 'row' },

  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.tintGold,
    borderWidth: 0.5, borderColor: COLORS.borderGold,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  botAvatarText: { fontSize: 16 },

  bubbleText: { maxWidth: '78%', borderRadius: RADIUS.lg, padding: SPACING.md },
  bubbleTextUser: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 4,
  },
  bubbleTextBot: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5, borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  msgText:     { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, lineHeight: 22 },
  msgTextUser: { color: COLORS.textOnGold },

  loadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, paddingHorizontal: SPACING.md },

  suggestions: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  suggestion: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  suggestionText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: SPACING.md, gap: SPACING.sm,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: COLORS.textPrimary,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.goldGlow,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
});
