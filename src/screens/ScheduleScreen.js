import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { GROUP_MATCHES, KNOCKOUT_MATCHES, STAGE } from '../data/schedule';
import { TEAM_FLAGS } from '../data/stickerTypes';
import { initRemoteConfig, getMatchResults } from '../services/remoteConfig';

const TABS = ['group', 'knockout'];

export default function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('group');
  const [predictions, setPredictions] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {
    initRemoteConfig().then(() => setResults(getMatchResults()));
  }, []);

  const groupSections = buildGroupSections(GROUP_MATCHES, t);
  const knockoutSections = buildKnockoutSections(KNOCKOUT_MATCHES, t);
  const sections = activeTab === 'group' ? groupSections : knockoutSections;

  const predict = (matchId, team) => {
    setPredictions(p => ({ ...p, [matchId]: team }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Stage tabs */}
      <LinearGradient colors={GRADIENTS.greenHeader} style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'group' ? t('schedule.groupStage') : t('schedule.knockout')}
            </Text>
          </TouchableOpacity>
        ))}
      </LinearGradient>

      <SectionList
        sections={sections}
        keyExtractor={m => m.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            result={results[item.id]}
            prediction={predictions[item.id]}
            onPredict={team => predict(item.id, team)}
          />
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

function MatchCard({ match, result, prediction, onPredict }) {
  const { t, i18n } = useTranslation();
  const homeFlag = TEAM_FLAGS[match.home] ?? '🏳️';
  const awayFlag = TEAM_FLAGS[match.away] ?? '🏳️';
  const isFinished = result != null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  // Wer hat gewonnen (für Hervorhebung)
  const homeWon = isFinished && result.h > result.a;
  const awayWon = isFinished && result.a > result.h;

  return (
    <View style={[styles.matchCard, isFinished && styles.matchCardFinished]}>
      <View style={styles.matchHeaderRow}>
        <Text style={styles.matchDate}>{formatDate(match.date)} · {match.time}</Text>
        {isFinished && (
          <View style={styles.finishedBadge}>
            <Text style={styles.finishedBadgeText}>FT</Text>
          </View>
        )}
      </View>

      <View style={styles.matchRow}>
        {/* Home */}
        <TouchableOpacity
          style={[
            styles.teamBtn,
            prediction === match.home && styles.teamBtnPicked,
            homeWon && styles.teamBtnWinner,
          ]}
          onPress={() => !isFinished && onPredict(match.home)}
          activeOpacity={isFinished ? 1 : 0.7}
        >
          <Text style={styles.teamFlag}>{homeFlag}</Text>
          <Text style={[styles.teamCode, isFinished && styles.teamCodeFinished]}>{match.home}</Text>
        </TouchableOpacity>

        {/* Score oder VS */}
        <View style={styles.vsBox}>
          {isFinished ? (
            <Text style={styles.scoreText}>{result.h} – {result.a}</Text>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>

        {/* Away */}
        <TouchableOpacity
          style={[
            styles.teamBtn,
            prediction === match.away && styles.teamBtnPicked,
            awayWon && styles.teamBtnWinner,
          ]}
          onPress={() => !isFinished && onPredict(match.away)}
          activeOpacity={isFinished ? 1 : 0.7}
        >
          <Text style={styles.teamFlag}>{awayFlag}</Text>
          <Text style={[styles.teamCode, isFinished && styles.teamCodeFinished]}>{match.away}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>

      {prediction && !isFinished && (
        <View style={styles.predRow}>
          <Text style={styles.predText}>
            {t('schedule.yourPrediction')}: {TEAM_FLAGS[prediction] ?? '🏳️'} {prediction}
          </Text>
        </View>
      )}
      {prediction && isFinished && (
        <View style={[styles.predRow, prediction === match.home && homeWon || prediction === match.away && awayWon ? styles.predRowCorrect : styles.predRowWrong]}>
          <Text style={[styles.predText, prediction === match.home && homeWon || prediction === match.away && awayWon ? styles.predTextCorrect : styles.predTextWrong]}>
            {prediction === match.home && homeWon || prediction === match.away && awayWon ? '✅' : '❌'} {t('schedule.yourPrediction')}: {TEAM_FLAGS[prediction] ?? '🏳️'} {prediction}
          </Text>
        </View>
      )}
    </View>
  );
}

function buildGroupSections(matches, t) {
  const byGroup = {};
  for (const m of matches) {
    if (!byGroup[m.group]) byGroup[m.group] = [];
    byGroup[m.group].push(m);
  }
  return Object.entries(byGroup).map(([g, data]) => ({
    title: t(`album.groups.${g}`),
    data,
  }));
}

function buildKnockoutSections(matches, t) {
  const stages = [STAGE.R32, STAGE.R16, STAGE.QF, STAGE.SF, STAGE.THIRD, STAGE.FINAL];
  const stageLabels = {
    [STAGE.R32]: 'Round of 32',
    [STAGE.R16]: t('schedule.roundOf16'),
    [STAGE.QF]: t('schedule.quarterfinal'),
    [STAGE.SF]: t('schedule.semifinal'),
    [STAGE.THIRD]: t('schedule.thirdPlace'),
    [STAGE.FINAL]: t('schedule.final'),
  };
  return stages
    .map(stage => ({
      title: stageLabels[stage],
      data: matches.filter(m => m.stage === stage),
    }))
    .filter(s => s.data.length > 0);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  tabText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  tabTextActive: { color: COLORS.blue, fontWeight: FONTS.weights.semibold },
  list: { paddingBottom: SPACING.xxxl },
  sectionHeader: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.gold, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, letterSpacing: 0.5 },
  matchCard: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  matchCardFinished: { opacity: 0.85 },
  matchHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  matchDate: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
  finishedBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  finishedBadgeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, letterSpacing: 0.5 },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  teamBtn: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  teamBtnPicked: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  teamBtnWinner: { backgroundColor: 'rgba(66,215,131,0.12)', borderColor: 'rgba(66,215,131,0.4)' },
  teamFlag: { fontSize: 32, marginBottom: 4 },
  teamCode: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  teamCodeFinished: { color: COLORS.textSecondary },
  vsBox: { paddingHorizontal: SPACING.lg, alignItems: 'center' },
  vsText: { color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.black },
  scoreText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.black, letterSpacing: 1 },
  venue: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs },
  predRow: { backgroundColor: COLORS.blueTint, borderRadius: RADIUS.sm, padding: SPACING.xs, paddingHorizontal: SPACING.md },
  predText: { color: COLORS.blue, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  predRowCorrect: { backgroundColor: 'rgba(66,215,131,0.12)' },
  predRowWrong: { backgroundColor: 'rgba(255,100,100,0.12)' },
  predTextCorrect: { color: '#42D783' },
  predTextWrong: { color: '#FF6464' },
});
