import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { GROUP_MATCHES, KNOCKOUT_MATCHES, STAGE } from '../data/schedule';
import { TEAMS } from '../data/stickerTypes';

const TABS = ['group', 'knockout'];

export default function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('group');
  const [predictions, setPredictions] = useState({});

  const groupSections = buildGroupSections(GROUP_MATCHES, t);
  const knockoutSections = buildKnockoutSections(KNOCKOUT_MATCHES, t);
  const sections = activeTab === 'group' ? groupSections : knockoutSections;

  const predict = (matchId, team) => {
    setPredictions(p => ({ ...p, [matchId]: team }));
  };

  return (
    <View style={styles.container}>
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

function MatchCard({ match, prediction, onPredict }) {
  const { t } = useTranslation();
  const homeTeam = TEAMS[match.home];
  const awayTeam = TEAMS[match.away];
  const isKnockout = match.stage !== STAGE.GROUP;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  return (
    <View style={styles.matchCard}>
      <Text style={styles.matchDate}>{formatDate(match.date)} · {match.time}</Text>

      <View style={styles.matchRow}>
        {/* Home */}
        <TouchableOpacity
          style={[styles.teamBtn, prediction === match.home && styles.teamBtnPicked]}
          onPress={() => onPredict(match.home)}
        >
          <Text style={styles.teamFlag}>{homeTeam?.flag ?? '🏳️'}</Text>
          <Text style={styles.teamCode}>{match.home}</Text>
        </TouchableOpacity>

        <View style={styles.vsBox}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Away */}
        <TouchableOpacity
          style={[styles.teamBtn, prediction === match.away && styles.teamBtnPicked]}
          onPress={() => onPredict(match.away)}
        >
          <Text style={styles.teamFlag}>{awayTeam?.flag ?? '🏳️'}</Text>
          <Text style={styles.teamCode}>{match.away}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>

      {prediction && (
        <View style={styles.predRow}>
          <Text style={styles.predText}>
            {t('schedule.yourPrediction')}: {TEAMS[prediction]?.flag} {prediction}
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
  tabActive: { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenLight },
  tabText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  tabTextActive: { color: COLORS.greenBright, fontWeight: FONTS.weights.semibold },
  list: { paddingBottom: SPACING.xxxl },
  sectionHeader: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
  matchCard: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  matchDate: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.sm },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  teamBtn: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  teamBtnPicked: { backgroundColor: COLORS.greenDeep, borderColor: COLORS.greenLight },
  teamFlag: { fontSize: 28, marginBottom: 2 },
  teamCode: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  vsBox: { paddingHorizontal: SPACING.lg },
  vsText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.black },
  venue: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.xs },
  predRow: { backgroundColor: COLORS.greenDeep, borderRadius: RADIUS.sm, padding: SPACING.xs, paddingHorizontal: SPACING.md },
  predText: { color: COLORS.greenBright, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold },
});
