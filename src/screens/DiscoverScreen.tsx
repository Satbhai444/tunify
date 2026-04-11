import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerStore, useLibraryStore, useSettingsStore } from '../stores';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { searchSongs, getCuratedSection, getTrending, getDeezerChart } from '../api/musicService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Track } from '../types/music';
import { MaterialIcon } from '../components/MaterialIcon';

const { width: SCREEN_W } = Dimensions.get('window');

/* ──────────── Helpers ──────────── */

function getTopArtistsFromHistory(liked: Track[], recent: Track[]): string[] {
  const counts = new Map<string, number>();
  [...liked, ...recent].forEach((t) => {
    const a = t.artist?.split(',')[0]?.trim();
    if (a) counts.set(a, (counts.get(a) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n]) => n);
}

function getTopGenresFromHistory(liked: Track[], recent: Track[]): string[] {
  const genreMap: Record<string, string[]> = {
    'Bollywood': ['arijit', 'shreya', 'neha', 'pritam', 'vishal', 'ar rahman', 'lata', 'kumar sanu', 'udit'],
    'Pop': ['taylor', 'dua lipa', 'weeknd', 'justin', 'ariana', 'ed sheeran', 'billie'],
    'Hip-Hop': ['drake', 'kendrick', 'travis', 'eminem', 'kanye', 'j cole', 'nas'],
    'Punjabi': ['diljit', 'ap dhillon', 'sidhu', 'karan aujla', 'jazzy b', 'guru randhawa'],
    'K-Pop': ['bts', 'blackpink', 'stray kids', 'twice', 'exo', 'nct'],
    'Rock': ['coldplay', 'imagine dragons', 'linkin park', 'green day', 'foo fighters'],
    'Lo-Fi': ['lofi', 'chill', 'relaxing', 'instrumental', 'ambient'],
    'Romantic': ['love', 'romance', 'romantic', 'heart'],
  };
  const genreScores = new Map<string, number>();
  const allArtists = [...liked, ...recent].map((t) => t.artist?.toLowerCase() || '');
  Object.entries(genreMap).forEach(([genre, keywords]) => {
    let score = 0;
    allArtists.forEach((a) => { if (keywords.some((k) => a.includes(k))) score++; });
    if (score > 0) genreScores.set(genre, score);
  });
  return [...genreScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g);
}

function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

/* ──────────── Daily Mix Config ──────────── */
interface DailyMix {
  id: string;
  title: string;
  subtitle: string;
  gradient: [string, string];
  emoji: string;
  tracks: Track[];
}

const Skeleton = ({ width, height, borderRadius, style }: any) => (
  <View style={[{ width, height, borderRadius, backgroundColor: 'rgba(255,255,255,0.05)' }, style]} />
);

const MixCardSkeleton = () => (
  <View style={{ width: 150, height: 180, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' }} />
);

const TrackItemSkeleton = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <Skeleton width={44} height={44} borderRadius={8} />
    <View style={{ flex: 1, gap: 6 }}>
      <Skeleton width="60%" height={14} borderRadius={4} />
      <Skeleton width="40%" height={10} borderRadius={4} />
    </View>
  </View>
);

const DAILY_MIX_TEMPLATES = [
  { id: 'dm1', title: 'Daily Mix 1', emoji: '💚', gradient: ['#1db954', '#0a5c2b'] as [string, string] },
  { id: 'dm2', title: 'Daily Mix 2', emoji: '💙', gradient: ['#4a90d9', '#1a3a6c'] as [string, string] },
  { id: 'dm3', title: 'Daily Mix 3', emoji: '💜', gradient: ['#8b5cf6', '#4c1d95'] as [string, string] },
];

/* ──────────── MAIN SCREEN ──────────── */

export function DiscoverScreen({ navigation }: any) {
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [forYouTracks, setForYouTracks] = useState<Track[]>([]);
  const [dailyMixes, setDailyMixes] = useState<DailyMix[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [weeklyDiscovery, setWeeklyDiscovery] = useState<Track[]>([]);
  const [becauseYouLiked, setBecauseYouLiked] = useState<{ artist: string; tracks: Track[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { play } = usePlayerStore();

  const fetchAll = useCallback(async () => {
    const topArtists = getTopArtistsFromHistory(likedSongs, recentlyPlayed);
    const topGenres = getTopGenresFromHistory(likedSongs, recentlyPlayed);

    const promises: Promise<any>[] = [];

    // 1. For You personalized tracks
    const forYouQuery = topArtists.length > 0
      ? topArtists.slice(0, 3).join(' ') + ' best new songs 2024'
      : 'trending best songs 2024';
    promises.push(
      getCuratedSection(forYouQuery, 25).catch(() => [] as Track[]),
    );

    // 2. Daily Mixes — each based on different genre/artist clusters
    const mixQueries = topGenres.length >= 2
      ? topGenres.slice(0, 3).map((g) => `best ${g} songs mix`)
      : ['bollywood romantic hits mix', 'english pop dance mix', 'trending viral songs mix'];
    mixQueries.forEach((q) => {
      promises.push(searchSongs(q).catch(() => [] as Track[]));
    });

    // 3. Trending
    promises.push(getTrending().catch(() => [] as Track[]));

    // 4. Weekly Discovery — genres the user listens to but explore deeper
    const weeklyQuery = topArtists.length > 2
      ? `${topArtists[2]} ${topGenres[0] || 'chill'} hidden gems underrated`
      : 'new indie underrated hidden gems 2024';
    promises.push(searchSongs(weeklyQuery).catch(() => [] as Track[]));

    // 5. "Because you liked..." — top 3 artists
    const bylArtists = topArtists.slice(0, 3);
    bylArtists.forEach((a) => {
      promises.push(searchSongs(`${a} similar songs`).catch(() => [] as Track[]));
    });

    const results = await Promise.all(promises);

    let idx = 0;

    // For You
    const existingIds = new Set([...likedSongs, ...recentlyPlayed].map((t) => t.id));
    const fyRaw = results[idx++] as Track[];
    setForYouTracks(shuffleArray(fyRaw.filter((t) => !existingIds.has(t.id))).slice(0, 20));

    // Daily Mixes
    const mixes: DailyMix[] = [];
    for (let i = 0; i < Math.min(3, mixQueries.length); i++) {
      const tracks = results[idx++] as Track[];
      if (tracks.length > 3) {
        const template = DAILY_MIX_TEMPLATES[i];
        const artistNames = [...new Set(tracks.slice(0, 4).map((t) => t.artist?.split(',')[0]?.trim()))].slice(0, 3);
        mixes.push({
          ...template,
          subtitle: artistNames.join(', '),
          tracks: shuffleArray(tracks).slice(0, 20),
        });
      }
    }
    setDailyMixes(mixes);

    // Trending
    setTrendingTracks((results[idx++] as Track[]).slice(0, 20));

    // Weekly Discovery
    const wdRaw = results[idx++] as Track[];
    setWeeklyDiscovery(shuffleArray(wdRaw.filter((t) => !existingIds.has(t.id))).slice(0, 25));

    // Because you liked
    const bylSections: { artist: string; tracks: Track[] }[] = [];
    bylArtists.forEach((a) => {
      const tracks = results[idx++] as Track[];
      if (tracks.length > 2) {
        bylSections.push({ artist: a, tracks: tracks.slice(0, 12) });
      }
    });
    setBecauseYouLiked(bylSections);

    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [likedSongs.length, recentlyPlayed.length]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handlePlay = (track: Track, queue: Track[]) => {
    play(track, queue);
    navigation.navigate('Player');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={themeMode === 'dark' ? ['#1e1e1e', '#121212', '#000000'] : ['#F8F9FE', '#FFFFFF', '#F0F2FF']}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60 }} showsVerticalScrollIndicator={false}>
          <Skeleton width="50%" height={32} borderRadius={4} style={{ marginBottom: 24 }} />
          
          <View style={{ marginBottom: 32 }}>
            <Skeleton width="40%" height={24} borderRadius={4} style={{ marginBottom: 16 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {[1, 2, 3].map((i) => <MixCardSkeleton key={i} />)}
            </ScrollView>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Skeleton width="60%" height={24} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={{ gap: 12 }}>
              {[1, 2, 3, 4].map((i) => <TrackItemSkeleton key={i} />)}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Discover</Text>
          <TouchableOpacity onPress={onRefresh}>
            <MaterialIcon name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ═══════ FOR YOU ═══════ */}
        {forYouTracks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>✨ For You</Text>
              <Text style={[styles.sectionSub, { color: colors.onSurfaceVariant }]}>Based on your taste</Text>
            </View>
            <FlatList
              data={forYouTracks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `fy_${item.id}`}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.trackCard} onPress={() => handlePlay(item, forYouTracks)} activeOpacity={0.8}>
                  <Image source={{ uri: item.artwork }} style={styles.trackCardImg} />
                  <View style={[styles.trackCardOverlay, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)' }]}>
                    <Text style={[styles.trackCardTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.trackCardArtist, { color: colors.primary }]} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ═══════ DAILY MIXES ═══════ */}
        {dailyMixes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🎵 Daily Mixes</Text>
              <Text style={[styles.sectionSub, { color: colors.onSurfaceVariant }]}>Updated daily based on you</Text>
            </View>
            <FlatList
              data={dailyMixes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}
              renderItem={({ item: mix }) => (
                <TouchableOpacity
                  style={styles.dailyMixCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (mix.tracks.length > 0) handlePlay(mix.tracks[0], mix.tracks);
                  }}
                >
                  <LinearGradient colors={mix.gradient} style={styles.dailyMixGradient}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>{mix.emoji}</Text>
                    <Text style={styles.dailyMixTitle}>{mix.title}</Text>
                    <Text style={styles.dailyMixSub} numberOfLines={2}>{mix.subtitle}</Text>
                    <View style={[styles.dailyMixPlayBtn, { backgroundColor: colors.primary }]}>
                      <MaterialIcon name="play-arrow" size={20} color="#FFF" />
                    </View>
                  </LinearGradient>
                  {/* Mini art mosaic */}
                  <View style={styles.dailyMixArts}>
                    {mix.tracks.slice(0, 4).map((t, i) => (
                      <Image key={`${mix.id}_art_${i}`} source={{ uri: t.artwork }} style={[styles.dailyMixArtImg, { backgroundColor: colors.surfaceContainer }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ═══════ TRENDING NEAR YOU ═══════ */}
        {trendingTracks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>📈 Trending Now</Text>
              <Text style={[styles.sectionSub, { color: colors.onSurfaceVariant }]}>What everyone's listening to</Text>
            </View>
            {trendingTracks.slice(0, 8).map((track, i) => (
              <TouchableOpacity
                key={`trend_${track.id}`}
                style={styles.trendRow}
                activeOpacity={0.7}
                onPress={() => handlePlay(track, trendingTracks)}
              >
                <Text style={[styles.trendIdx, { color: colors.onSurfaceVariant }]}>{i + 1}</Text>
                <Image source={{ uri: track.artwork }} style={[styles.trendArt, { backgroundColor: colors.surfaceContainer }]} />
                <View style={styles.trendInfo}>
                  <Text style={[styles.trendTitle, { color: colors.onSurface }]} numberOfLines={1}>{track.title}</Text>
                  <Text style={[styles.trendArtist, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{track.artist}</Text>
                </View>
                {i < 3 && (
                  <View style={[styles.trendBadge, i === 0 && { backgroundColor: '#FFD700' }, i === 1 && { backgroundColor: '#C0C0C0' }, i === 2 && { backgroundColor: '#CD7F32' }]}>
                    <MaterialIcon name="trending-up" size={12} color="#000" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => handlePlay(track, trendingTracks)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcon name="play-circle-outline" size={26} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ═══════ BECAUSE YOU LIKED ═══════ */}
        {becauseYouLiked.map((section) => (
          <View key={`byl_${section.artist}`} style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>💚 Because you like {section.artist}</Text>
            </View>
            <FlatList
              data={section.tracks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `byl_${section.artist}_${item.id}`}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.trackCard} onPress={() => handlePlay(item, section.tracks)} activeOpacity={0.8}>
                  <Image source={{ uri: item.artwork }} style={styles.trackCardImg} />
                  <View style={[styles.trackCardOverlay, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)' }]}>
                    <Text style={[styles.trackCardTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.trackCardArtist, { color: colors.primary }]} numberOfLines={1}>{item.artist}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        ))}

        {/* ═══════ WEEKLY DISCOVERY ═══════ */}
        {weeklyDiscovery.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>🔮 Weekly Discovery</Text>
              <Text style={[styles.sectionSub, { color: colors.onSurfaceVariant }]}>Fresh picks every week</Text>
            </View>
            <LinearGradient colors={themeMode === 'dark' ? ['#1a1a2e', '#16213e'] : ['#E0E7FF', '#C7D2FE']} style={styles.weeklyHero}>
              <View style={styles.weeklyHeroHeader}>
                <View>
                  <Text style={[typography.titleLg, { color: '#fff', fontWeight: '800' }]}>Discover Weekly</Text>
                  <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.6)', marginTop: 4 }]}>
                    {weeklyDiscovery.length} fresh tracks for you
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.weeklyPlayBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handlePlay(weeklyDiscovery[0], weeklyDiscovery)}
                >
                  <MaterialIcon name="play-arrow" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.weeklyArtRow}>
                {weeklyDiscovery.slice(0, 6).map((t, i) => (
                  <Image key={`wd_art_${i}`} source={{ uri: t.artwork }} style={[styles.weeklyArtImg, { backgroundColor: colors.surfaceContainer }]} />
                ))}
              </View>
            </LinearGradient>
            <FlatList
              data={weeklyDiscovery.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `wd_${item.id}`}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14, marginTop: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.wideCard} onPress={() => handlePlay(item, weeklyDiscovery)} activeOpacity={0.8}>
                  <Image source={{ uri: item.artwork }} style={styles.wideCardImg} />
                  <Text style={[styles.wideCardTitle, { color: colors.onSurface }]} numberOfLines={2}>{item.title}</Text>
                  <Text style={[styles.wideCardArtist, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        <MadeInIndiaFooter />
      </Animated.ScrollView>
    </View>
  );
}

function MadeInIndiaFooter() {
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={{ padding: 40, alignItems: 'center', opacity: 0.5 }}>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600', letterSpacing: 1.2 }}>
        MADE WITH ❤️ IN INDIA
      </Text>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: 10, marginTop: 4 }}>
        tunify v1.2.0 Build
      </Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface, fontWeight: '800' },

  section: { marginBottom: 28 },
  sectionRow: { paddingHorizontal: spacing.xl, marginBottom: 14 },
  sectionTitle: { ...typography.headlineSm, color: colors.onSurface, fontWeight: '700' },
  sectionSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },

  /* Track card */
  trackCard: { width: 150, height: 150, borderRadius: radii.md, overflow: 'hidden' },
  trackCardImg: { width: '100%', height: '100%' },
  trackCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.65)' },
  trackCardTitle: { ...typography.bodySm, color: colors.onSurface, fontWeight: '700' },
  trackCardArtist: { fontSize: 10, color: colors.primary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8 },

  /* Daily Mix */
  dailyMixCard: { width: 180, borderRadius: radii.lg, overflow: 'hidden' },
  dailyMixGradient: { padding: 16, paddingBottom: 12, alignItems: 'flex-start' },
  dailyMixTitle: { ...typography.titleMd, color: '#fff', fontWeight: '800' },
  dailyMixSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  dailyMixPlayBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginTop: 8,
  },
  dailyMixArts: { flexDirection: 'row', flexWrap: 'wrap' },
  dailyMixArtImg: { width: 90, height: 60, backgroundColor: colors.surfaceContainer },

  /* Trending */
  trendRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 8 },
  trendIdx: { width: 24, ...typography.titleSm, color: colors.onSurfaceVariant, textAlign: 'center', fontWeight: '700' },
  trendArt: { width: 48, height: 48, borderRadius: radii.sm, marginLeft: 10, backgroundColor: colors.surfaceContainer },
  trendInfo: { flex: 1, marginLeft: 12 },
  trendTitle: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  trendArtist: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  trendBadge: {
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },

  /* Weekly Discovery */
  weeklyHero: { marginHorizontal: spacing.xl, borderRadius: radii.lg, padding: 20 },
  weeklyHeroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyPlayBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  weeklyArtRow: { flexDirection: 'row', marginTop: 16, gap: 6 },
  weeklyArtImg: { width: 44, height: 44, borderRadius: radii.sm, backgroundColor: colors.surfaceContainer },

  /* Wide card */
  wideCard: { width: 170, borderRadius: radii.md, overflow: 'hidden' },
  wideCardImg: { width: 170, height: 170, borderRadius: radii.md },
  wideCardTitle: { ...typography.bodySm, color: colors.onSurface, fontWeight: '700', marginTop: 8, paddingHorizontal: 2 },
  wideCardArtist: { fontSize: 11, color: colors.onSurfaceVariant, paddingHorizontal: 2, marginTop: 2 },
});
