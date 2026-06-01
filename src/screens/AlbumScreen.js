import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SectionList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { STICKER_CATALOG, TOTAL_STICKERS, getTeamStickers } from '../data/stickerCatalog';
import { TEAMS, GROUPS } from '../data/stickerTypes';
import { loadCollection, addToHave, addToNeed, addDuplicate } from '../services/storage';
import StickerBadge from '../components/StickerBadge';

const FILTER = { ALL: 'all', OWNED: 'owned', MISSING: 'missing', DUPLICATES: 'duplicates' };

export default function AlbumScreen() {
  const { t } = useTranslation();
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [filter, setFilter] = useState(FILTER.ALL);
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState('D'); // DACH group open by default

  useFocusEffect(useCallback(() => { loadCollection().then(setCollection); }, []));

  const totalOwned = collection.have.length;
  const percent = Math.round((totalOwned / TOTAL_STICKERS) * 100);

  // Build sections by group
  const sections = useMemo(() => {
    return Object.entries(GROUPS).map(([groupLetter, groupData]) => {
      const teamCodes = groupData.teams;
      // Get all stickers for all teams in this group, apply filter
      const stickers = teamCodes.flatMap(code => getTeamStickers(code)).filter(s => {
        const matchesSearch = !search ||
          s.playerName?.toLowerCase().includes(search.toLowerCase()) ||
          s.teamNameDE?.toLowerCase().includes(search.toLowerCase()) ||
          s.teamNameEN?.toLowerCase().includes(search.toLowerCase()) ||
          String(s.number).includes(search);
        const matchesFilter =
          filter === FILTER.ALL ? true :
          filter === FILTER.OWNED ? collection.have.includes(s.id) :
          filter === FILTER.MISSING ? !collection.have.includes(s.id) :
          filter === FILTER.DUPLICATES ? !!collection.duplicates[s.id] :
          true;
        return matchesSearch && matchesFilter;
      });

      const ownedInGroup = stickers.filter(s => collection.have.includes(s.id)).length;

      return {
        title: t(`album.groups.${groupLetter}`),
        groupLetter,
        data: expandedGroup === groupLetter ? stickers : [],
        totalInGroup: stickers.length,
        ownedInGroup,
      };
    }).filter(s => s.totalInGroup > 0 || expandedGroup === s.groupLetter);
  }, [collection, filter, search, expandedGroup, t]);

  const toggleSticker = async (sticker) => {
    const owned = collection.have.includes(sticker.id);
    const col = owned
      ? await addDuplicate(sticker.id)
      : await addToHave(sticker.id);
    setCollection(col);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getStickerStatus = (sticker) => {
    if (collection.have.includes(sticker.id)) return 'owned';
    if (collection.need.includes(sticker.id)) return 'missing';
    return 'unknown';
  };

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <LinearGradient colors={GRADIENTS.greenHeader} style={styles.header}>
        <Text style={styles.progressText}>
          {t('album.progress', { owned: totalOwned, total: TOTAL_STICKERS, percent })}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('album.search')}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {Object.values(FILTER).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {t(`album.filter.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Group sections */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section }) => (
          <GroupHeader
            section={section}
            expanded={expandedGroup === section.groupLetter}
            onPress={() => setExpandedGroup(
              expandedGroup === section.groupLetter ? null : section.groupLetter
            )}
          />
        )}
        renderItem={({ item, section }) => (
          <StickerRow
            sticker={item}
            status={getStickerStatus(item)}
            duplicateCount={collection.duplicates[item.id]}
            onPress={() => toggleSticker(item)}
          />
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

function GroupHeader({ section, expanded, onPress }) {
  const owned = section.ownedInGroup;
  const total = section.totalInGroup;
  const pct = total ? Math.round((owned / total) * 100) : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#111D14', '#192B1E']} style={styles.groupHeader}>
        <View style={styles.groupHeaderLeft}>
          <Text style={styles.groupTitle}>{section.title}</Text>
          <Text style={styles.groupSub}>{owned}/{total} · {pct}%</Text>
        </View>
        <Text style={styles.groupChevron}>{expanded ? '▲' : '▼'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function StickerRow({ sticker, status, duplicateCount, onPress }) {
  const statusColor = status === 'owned' ? COLORS.owned : status === 'missing' ? COLORS.missing : COLORS.unknown;
  const teamInfo = TEAMS[sticker.team];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.stickerRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.stickerNum}>#{sticker.number}</Text>
        <View style={styles.stickerMeta}>
          <View style={styles.stickerNameRow}>
            <Text style={styles.stickerPlayer} numberOfLines={1}>
              {sticker.playerName ?? `${teamInfo?.flag ?? ''} ${sticker.teamNameDE}`}
            </Text>
            <StickerBadge type={sticker.type} />
          </View>
          <Text style={styles.stickerTeam}>{teamInfo?.flag} {sticker.teamNameDE}</Text>
        </View>
        {duplicateCount && (
          <View style={styles.dupBadge}>
            <Text style={styles.dupText}>{duplicateCount}×</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.lg, paddingTop: SPACING.xl },
  progressText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, marginBottom: SPACING.sm },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full },
  searchRow: { padding: SPACING.md, backgroundColor: COLORS.surface },
  searchInput: {
    backgroundColor: COLORS.surfaceRaised,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    fontSize: FONTS.sizes.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterRow: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm },
  filterTab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenLight },
  filterLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  filterLabelActive: { color: COLORS.greenBright, fontWeight: FONTS.weights.semibold },
  list: { paddingBottom: SPACING.xxxl },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  groupHeaderLeft: { flex: 1 },
  groupTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  groupSub: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  groupChevron: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  statusDot: { width: 10, height: 10, borderRadius: RADIUS.full, marginRight: SPACING.md },
  stickerNum: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, width: 40, fontWeight: FONTS.weights.semibold },
  stickerMeta: { flex: 1 },
  stickerNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stickerPlayer: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, flex: 1 },
  stickerTeam: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  dupBadge: { backgroundColor: COLORS.goldDeep, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  dupText: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
});
