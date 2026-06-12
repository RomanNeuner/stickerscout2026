import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SectionList,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { TOTAL_STICKERS, TOTAL_ALL_STICKERS, GROUPS, TEAMS_MAP, getTeamStickers, STICKER_DB, CC_STICKERS, EXTRA_STICKERS } from '../data/stickerCatalog';
import { ADRENALYN_DB, SPECIAL_CARDS_FLAT, HERO_CARDS, LIMITED_EDITION_CARDS, DREAM_BOX_CARDS, STANDARD_LE_CARDS, STANDARD_LE_ESTIMATED_TOTAL, TOTAL_ADRENALYN, CARD_TYPE_LABELS, CARD_TYPE_COLORS } from '../data/adrenalynCatalog';
import { TEAM_FLAGS } from '../data/stickerTypes';
import { loadCollection, addToHave, addToNeed, addDuplicate, setStickerCount, getStickerCount, loadAdrenalynCollection, addAdrenalynCard, setAdrenalynCount, getAdrenalynCount } from '../services/storage';
import StickerBadge from '../components/StickerBadge';
import AppIcon from '../components/AppIcon';

const FILTER = { ALL: 'all', OWNED: 'owned', MISSING: 'missing', DUPLICATES: 'duplicates' };
const ALBUM_TAB = { STICKER: 'sticker', ADRENALYN: 'adrenalyn' };

export default function AlbumScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const sectionListRef = useRef(null);
  const [albumTab, setAlbumTab] = useState(ALBUM_TAB.STICKER);
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [adrenalynColl, setAdrenalynColl] = useState({ have: [], duplicates: {} });
  const [filter, setFilter] = useState(FILTER.ALL);
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState('J'); // Austria Group J open by default
  const [highlightId, setHighlightId] = useState(null);

  useFocusEffect(useCallback(() => {
    loadCollection().then(setCollection);
    loadAdrenalynCollection().then(setAdrenalynColl);
  }, []));

  // Handle navigation from Scanner — open correct group and highlight sticker
  useEffect(() => {
    const params = route.params;
    if (params?.highlightGroup) {
      setExpandedGroup(params.highlightGroup);
      setFilter(FILTER.ALL);
      setSearch('');
      if (params.highlightStickerId) {
        setHighlightId(params.highlightStickerId);
        setTimeout(() => setHighlightId(null), 3000);
      }
    }
  }, [route.params]);

  const totalOwned = collection.have.length;

  // Build sections by group
  const sections = useMemo(() => {
    return Object.entries(GROUPS).map(([groupLetter, teamCodes]) => {
      // Get all stickers for all teams in this group, apply filter
      const stickers = teamCodes.flatMap(code => getTeamStickers(code)).filter(s => {
        const matchesSearch = !search ||
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.teamName?.toLowerCase().includes(search.toLowerCase()) ||
          s.team?.toLowerCase().includes(search.toLowerCase()) ||
          s.id?.toLowerCase().includes(search.toLowerCase());
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

  const adrenalynOwned = adrenalynColl.have?.length ?? 0;
  const adrenalynPct   = Math.round((adrenalynOwned / TOTAL_ADRENALYN) * 100);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Album Tab Switcher */}
      <View style={styles.albumTabRow}>
        <TouchableOpacity
          style={[styles.albumTab, albumTab === ALBUM_TAB.STICKER && styles.albumTabActive]}
          onPress={() => setAlbumTab(ALBUM_TAB.STICKER)}
        >
          <Text style={[styles.albumTabText, albumTab === ALBUM_TAB.STICKER && styles.albumTabTextActive]}>
            {t('album.tabSticker', { owned: totalOwned, total: TOTAL_STICKERS })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.albumTab, albumTab === ALBUM_TAB.ADRENALYN && styles.albumTabActive]}
          onPress={() => setAlbumTab(ALBUM_TAB.ADRENALYN)}
        >
          <Text style={[styles.albumTabText, albumTab === ALBUM_TAB.ADRENALYN && styles.albumTabTextActive]}>
            {t('album.tabAdrenalyn', { owned: adrenalynOwned, total: TOTAL_ADRENALYN })}
          </Text>
        </TouchableOpacity>
      </View>

      {albumTab === ALBUM_TAB.ADRENALYN ? (
        <AdrenalynTab collection={adrenalynColl} onUpdate={setAdrenalynColl} />
      ) : (<>

      {/* Progress Header + Search + Filter — geteilt mit Adrenalyn-Tab */}
      <AlbumProgressHeader
        owned={totalOwned}
        total={TOTAL_STICKERS}
        gradientColors={GRADIENTS.greenHeader}
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('album.search')}
        filter={filter}
        onFilter={setFilter}
      />

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
            count={getStickerCount(collection, item.id)}
            onPress={() => toggleSticker(item)}
            onCountChange={async (n) => {
              const col = await setStickerCount(item.id, n);
              setCollection(col);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            highlighted={highlightId === item.id}
          />
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
      />
    </>)}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Adrenalyn XL Tab
// ---------------------------------------------------------------------------
// Alle 680 Album-Karten als Modul-Konstante (einmal berechnet, nicht bei jedem Render)
const ALL_ALBUM_CARDS = [
  ...(ADRENALYN_DB.golden_ballers ?? []).map(c => ({ ...c, section: 'Golden Baller' })),
  ...(ADRENALYN_DB.team_cards     ?? []).map(c => ({ ...c, section: 'Team Cards' })),
  ...SPECIAL_CARDS_FLAT,
  ...HERO_CARDS,
  ...LIMITED_EDITION_CARDS,
];
const CHASE_CARDS = [...DREAM_BOX_CARDS, ...STANDARD_LE_CARDS];

function AdrenalynTab({ collection, onUpdate }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState(FILTER.ALL);
  const [search, setSearch]  = useState('');

  // Normalisierter Owned-Check: Album speichert cardNumber als Zahl oder String je nach Einstiegspunkt
  const isOwned = useCallback((cardKey, cardNumber) => {
    return collection.have?.includes(cardKey) ||
           (cardNumber !== undefined && collection.have?.includes(cardNumber));
  }, [collection.have]);

  // Gefilterte + gesuchte Karten (nur Album-680)
  const filteredCards = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_ALBUM_CARDS.filter(item => {
      const cardKey = String(item.number ?? item.id ?? '');
      const owned = isOwned(cardKey, item.number);
      const count = getAdrenalynCount(collection, cardKey) || getAdrenalynCount(collection, item.number);

      const matchesSearch = !q ||
        item.name?.toLowerCase().includes(q) ||
        item.team?.toLowerCase().includes(q) ||
        cardKey.toLowerCase().includes(q) ||
        (item.id ?? '').toLowerCase().includes(q) ||
        item.position?.toLowerCase().includes(q);

      const matchesFilter =
        filter === FILTER.ALL       ? true :
        filter === FILTER.OWNED     ? owned :
        filter === FILTER.MISSING   ? !owned :
        filter === FILTER.DUPLICATES ? count > 1 :
        true;

      return matchesSearch && matchesFilter;
    });
  }, [collection, filter, search, isOwned]);

  const adrenalynOwned = collection.have?.length ?? 0;

  const handleToggle = async (cardKey) => {
    const col = await addAdrenalynCard(cardKey);
    onUpdate(col);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCount = async (cardKey, n) => {
    const col = await setAdrenalynCount(cardKey, n);
    onUpdate(col);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Chase-Sektion nur im ALL-Filter und wenn kein Such-String aktiv
  const chaseFooter = (filter === FILTER.ALL && !search && CHASE_CARDS.length > 0) ? (
    <View>
      <View style={styles.chaseSectionHeader}>
        <Text style={styles.chaseSectionTitle}>✨ Chase Cards</Text>
        <Text style={styles.chaseSectionSub}>
          Dream Box (24) · Limited Editions (~{STANDARD_LE_ESTIMATED_TOTAL}) · {t('album.chaseNote')}
        </Text>
      </View>
      {CHASE_CARDS.map(item => {
        const typeColor = CARD_TYPE_COLORS[item.type] ?? COLORS.textMuted;
        return (
          <View key={item.id} style={[styles.stickerRow, { opacity: 0.85 }]}>
            <View style={styles.stickerRowLeft}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.textMuted }]} />
              <Text style={[styles.stickerNum, { color: typeColor }]}>{item.id}</Text>
              <View style={styles.stickerMeta}>
                <Text style={styles.stickerPlayer} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.stickerTeam}>
                  <Text style={{ color: typeColor }}>{CARD_TYPE_LABELS[item.type] ?? item.type}</Text>
                  {item.series ? `  ·  ${item.series}` : ''}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  ) : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Fortschritt + Suche + Filter-Chips — gleiche Komponente wie Sticker-Tab */}
      <AlbumProgressHeader
        owned={adrenalynOwned}
        total={TOTAL_ADRENALYN}
        gradientColors={GRADIENTS.greenHeader}
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder={t('album.searchAdrenalyn')}
        filter={filter}
        onFilter={setFilter}
        accentColor={COLORS.gold}
      />

      <FlatList
        data={filteredCards}
        keyExtractor={c => String(c.id ?? c.number)}
        contentContainerStyle={styles.list}
        ListFooterComponent={chaseFooter}
        renderItem={({ item }) => {
          const cardKey = String(item.number ?? item.id ?? '');
          const owned = isOwned(cardKey, item.number);
          const count = getAdrenalynCount(collection, cardKey) || getAdrenalynCount(collection, item.number);
          const typeColor = CARD_TYPE_COLORS[item.type] ?? COLORS.textMuted;
          const displayId = item.id ? item.id : `#${item.number}`;
          return (
            <View style={styles.stickerRow}>
              <TouchableOpacity
                onPress={() => handleToggle(cardKey)}
                activeOpacity={0.7}
                style={styles.stickerRowLeft}
              >
                <View style={[styles.statusDot, { backgroundColor: owned ? COLORS.green : COLORS.unknown }]} />
                <Text style={[styles.stickerNum, { color: typeColor }]}>{displayId}</Text>
                <View style={styles.stickerMeta}>
                  <Text style={styles.stickerPlayer} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.stickerTeam}>
                    <Text style={{ color: typeColor }}>{CARD_TYPE_LABELS[item.type] ?? item.type}</Text>
                    {item.position ? `  ·  ${item.position}` : ''}
                    {item.team ? `  ·  ${item.team}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
              {owned && (
                <View style={styles.countRow}>
                  <TouchableOpacity onPress={() => handleCount(cardKey, Math.max(0, count - 1))} style={styles.countBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.countMinus}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.countVal}>{count}×</Text>
                  <TouchableOpacity onPress={() => handleCount(cardKey, count + 1)} style={[styles.countBtn, styles.countBtnPlus]} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.countPlus}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Gemeinsamer Album-Fortschritts-Header (Sticker + Adrenalyn)
// ---------------------------------------------------------------------------
function AlbumProgressHeader({ owned, total, gradientColors, searchValue, onSearch, searchPlaceholder, filter, onFilter }) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  return (
    <>
      <LinearGradient colors={gradientColors} style={styles.header}>
        <Text style={styles.progressText}>
          {t('album.progress', { owned, total, percent: pct })}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </LinearGradient>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={COLORS.textSecondary}
          value={searchValue}
          onChangeText={onSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.filterRow}>
        {Object.values(FILTER).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => onFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {t(`album.filter.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

function GroupHeader({ section, expanded, onPress }) {
  const owned = section.ownedInGroup;
  const total = section.totalInGroup;
  const pct = total ? Math.round((owned / total) * 100) : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#0D1F2D', '#122840']} style={styles.groupHeader}>
        <View style={styles.groupHeaderLeft}>
          <Text style={styles.groupTitle}>{section.title}</Text>
          <Text style={styles.groupSub}>{owned}/{total} · {pct}%</Text>
        </View>
        <Text style={styles.groupChevron}>{expanded ? '▲' : '▼'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function StickerRow({ sticker, status, count, onPress, onCountChange, highlighted }) {
  const { t } = useTranslation();
  const statusColor = status === 'owned' ? COLORS.owned : status === 'missing' ? COLORS.missing : COLORS.unknown;
  const flag = sticker.team ? (TEAM_FLAGS[sticker.team] ?? '') : '🌍';
  const owned = status === 'owned';

  return (
    <View style={[styles.stickerRow, highlighted && styles.stickerRowHighlighted]}>
      {/* Linke Zone: Tap zum Hinzufügen/Status ändern */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.stickerRowLeft}
      >
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.stickerNum}>{sticker.id}</Text>
        <View style={styles.stickerMeta}>
          <View style={styles.stickerNameRow}>
            <Text style={styles.stickerPlayer} numberOfLines={1}>
              {sticker.type === 'logo' ? t('sticker.teamLogo') : sticker.type === 'team_photo' ? t('sticker.teamPhoto') : sticker.name}
            </Text>
            {sticker.foil && <Text style={styles.foilBadge}>✨</Text>}
          </View>
          <Text style={styles.stickerTeam}>{flag} {sticker.team ? t('teams.' + sticker.team) : (sticker.teamName ?? '')}</Text>
        </View>
      </TouchableOpacity>

      {/* Rechte Zone: +/- unabhängig vom Row-Tap */}
      {owned && (
        <View style={styles.countRow}>
          <TouchableOpacity
            onPress={() => onCountChange(Math.max(0, count - 1))}
            style={styles.countBtn}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.countMinus}>−</Text>
          </TouchableOpacity>
          <Text style={styles.countVal}>{count}×</Text>
          <TouchableOpacity
            onPress={() => onCountChange(count + 1)}
            style={[styles.countBtn, styles.countBtnPlus]}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={styles.countPlus}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  // Album Tab Switcher
  albumTabRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  albumTab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  albumTabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.gold },
  albumTabText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  albumTabTextActive: { color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: '800' },

  header: { padding: SPACING.lg, paddingTop: SPACING.xl },
  progressText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, marginBottom: SPACING.sm },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full },
  searchRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    color: COLORS.textPrimary,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    fontSize: FONTS.sizes.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  filterRow: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, paddingTop: SPACING.xs, gap: SPACING.sm },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  filterLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '500' },
  filterLabelActive: { color: COLORS.blue, fontWeight: '700' },
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
  groupTitle: { color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  groupSub: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  chaseSectionHeader: { padding: SPACING.md, marginTop: SPACING.lg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  chaseSectionTitle: { color: '#C084FC', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  chaseSectionSub: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  groupChevron: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  stickerRowHighlighted: {
    backgroundColor: COLORS.blueTint,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  stickerRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  statusDot: { width: 10, height: 10, borderRadius: RADIUS.full, marginRight: SPACING.md },
  stickerNum: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, width: 48, fontWeight: '600' },
  foilBadge: { fontSize: 12 },
  stickerMeta: { flex: 1, marginRight: SPACING.sm },
  stickerNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stickerPlayer: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, flex: 1 },
  stickerTeam: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  dupBadge: { backgroundColor: COLORS.goldDeep, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  dupText: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },

  // +/- Counter in Album-Zeile
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  countBtn: {
    width: 28, height: 28, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  countBtnPlus: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  countMinus: { color: COLORS.red, fontSize: FONTS.sizes.lg, fontWeight: '700', lineHeight: 26 },
  countPlus: { color: COLORS.greenBright, fontSize: FONTS.sizes.lg, fontWeight: '700', lineHeight: 26 },
  countVal: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '700', minWidth: 26, textAlign: 'center' },
});
