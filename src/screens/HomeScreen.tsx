import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, ToastAndroid, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu } from '../components/BottomSheet';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { Skeleton, TrackItemSkeleton, PlaylistCardSkeleton } from '../components/SkeletonLoader';
import { getTrending, getPlaylistTracks, getCuratedSection, getDeezerChart, getNewReleases, getTopPlaylists, getTopArtists, getTopAlbums, getRandomNewHits, deduplicateTracks } from '../api';
import { usePlayerStore, useLibraryStore } from '../stores';
import { useSettingsStore, AVATAR_OPTIONS } from '../stores/settingsStore';
import { shareSong } from '../utils/shareUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Album, Artist, Playlist } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ───
interface TrackSection {
  key: string;
  title: string;
  tracks: Track[];
  emoji?: string;
}

// ─── Helpers ───
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Reusable Components ───

function SectionHeader({ title, onSeeAll, themeMode }: { title: string; onSeeAll?: () => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8 }}>
          <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PlaylistPill({ playlist, onPress, themeMode }: { playlist: Playlist; onPress: () => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <TouchableOpacity
      style={[styles.playlistPill, {
        backgroundColor: theme.surface,
        shadowColor: themeMode === 'dark' ? 'transparent' : '#B8A990',
        borderWidth: themeMode === 'dark' ? 1 : 0,
        borderColor: theme.outline,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: playlist.artwork }} style={styles.playlistPillImage} />
      <View style={styles.playlistPillInfo}>
        <Text style={[styles.playlistPillTitle, { color: theme.onSurface }]} numberOfLines={2}>{playlist.title}</Text>
        <View style={styles.playlistPillMeta}>
          <Text style={[styles.playlistPillSubtitle, { color: theme.onSurfaceVariant }]} numberOfLines={1}>MUSIC FOR YOU</Text>
          <View style={[styles.playIconTiny, { backgroundColor: theme.primary }]}>
            <MaterialIcon name="play-arrow" size={14} color="#FFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TrackItem({ track, onPress, onMore, themeMode }: { track: Track; onPress: () => void; onMore?: () => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <TouchableOpacity
      style={[styles.trackItemContainer, {
        backgroundColor: theme.surface,
        borderColor: themeMode === 'dark' ? theme.outline : 'transparent',
        borderWidth: themeMode === 'dark' ? 1 : 0,
        shadowColor: themeMode === 'dark' ? 'transparent' : '#B8A990',
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: track.artwork }} style={styles.trackRowImage} />
      <View style={styles.trackRowInfo}>
        <Text style={[styles.trackRowTitle, { color: theme.onSurface }]} numberOfLines={1}>{track.title}</Text>
        <Text style={[styles.trackRowArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{track.artist}</Text>
      </View>
      <TouchableOpacity onPress={onMore} hitSlop={{ top: 10, bottom: 10 }}>
        <MaterialIcon name="more-horiz" size={20} color={theme.onSurfaceVariant} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main HomeScreen ───

export function HomeScreen({ navigation }: any) {
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [newAlbums, setNewAlbums] = useState<Album[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const play = usePlayerStore((s) => s.play);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const [trackMenu, setTrackMenu] = useState<Track | null>(null);

  const { themeMode, userName, avatarId } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  function showToast(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }

  const fetchData = useCallback(async () => {
    const bollywoodQueries = ['Bollywood 2024', 'Arijit Singh Hits', 'Diljit Dosanjh', 'Lofi Bollywood', 'Party Mix', 'Romantic Hits'];
    const bQuery = bollywoodQueries[Math.floor(Math.random() * bollywoodQueries.length)];

    const playlistSeeds = [
      'Bollywood Party Hits',
      'Hindi Lo-Fi Chill',
      'Trending Punjabi 2024',
      '90s Bollywood Classics',
      'Arijit Singh Melodies',
      'Indie India Fresh',
      'Sufi & Devotional',
      'Ghazal Hits',
    ];
    const pQuery = playlistSeeds[Math.floor(Math.random() * playlistSeeds.length)] + ' ' + 
                   playlistSeeds[Math.floor(Math.random() * playlistSeeds.length)];

    const trackFetchers = [
      { key: 'trending', title: 'Trending Now', fetcher: getTrending },
      { key: 'bollywood', title: 'Bollywood Hits', fetcher: () => getCuratedSection(bQuery, 30) },
      { key: 'bestnew', title: 'Best new songs', fetcher: () => getRandomNewHits(30) },
    ];

    const [trackResults, fPlaylists] = await Promise.all([
      Promise.allSettled(trackFetchers.map((f) => f.fetcher())),
      getTopPlaylists(pQuery, 15).catch(() => [] as Playlist[]),
    ]);

    const shuffledPlaylists = fPlaylists
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const newSections: TrackSection[] = [];
    let allFetchedTracks: Track[] = [];

    (trackResults as PromiseSettledResult<Track[]>[]).forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allFetchedTracks = [...allFetchedTracks, ...result.value];
      }
    });

    const cleanPool = deduplicateTracks(allFetchedTracks);
    const seenIds = new Set<string>();

    trackFetchers.forEach((f, i) => {
      const result = trackResults[i];
      if (result.status === 'fulfilled') {
        const tracks = result.value
          .filter((t: Track) => cleanPool.some((p: Track) => p.id === t.id))
          .filter((t: Track) => !seenIds.has(t.id));
        
        if (tracks.length > 0) {
          const shuffled = [...tracks].sort(() => Math.random() - 0.5);
          newSections.push({
            key: f.key,
            title: f.title,
            tracks: shuffled,
          });
          tracks.forEach((t: Track) => seenIds.add(t.id));
        }
      }
    });

    setSections(newSections);
    setFeaturedPlaylists(shuffledPlaylists);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTrackPress = (track: Track, queue: Track[]) => {
    play(track, queue);
    navigation.navigate('Player');
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    navigation.navigate('PlaylistDetail', {
      playlistId: playlist.id,
      title: playlist.title,
      artwork: playlist.artwork,
      description: playlist.description ?? '',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Skeleton width={120} height={40} borderRadius={8} />
            <Skeleton width={44} height={44} borderRadius={22} />
          </View>
          
          <View style={{ marginVertical: 24 }}>
            <Skeleton width={150} height={28} borderRadius={4} style={{ marginBottom: 16 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {[1, 2, 3].map((i) => <PlaylistCardSkeleton key={i} />)}
            </ScrollView>
          </View>

          <View style={{ marginVertical: 24 }}>
            <Skeleton width={180} height={28} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={{ gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => <TrackItemSkeleton key={i} />)}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const heroSection = sections.find(s => s.key === 'trending') || sections[0];
  const bestNewSection = sections.find(s => s.key === 'bestnew');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greetingSub, { color: theme.onSurfaceVariant }]}>{getGreeting()}</Text>
            <Text style={[styles.greeting, { color: theme.onSurface }]}>{userName}</Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { backgroundColor: theme.surfaceContainer }]} onPress={() => navigation.navigate('Settings')}>
             <LinearGradient colors={selectedAvatar.bg} style={styles.profileCircle}>
                <Text style={{ fontSize: 18 }}>{selectedAvatar.emoji}</Text>
             </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Playlists */}
        <SectionHeader title="Playlists" themeMode={themeMode} />
        <FlatList
          data={featuredPlaylists}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `pill_${item.id}`}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <PlaylistPill playlist={item} onPress={() => handlePlaylistPress(item)} themeMode={themeMode} />
          )}
        />

        {/* Best New Songs */}
        <SectionHeader title="Best new songs" themeMode={themeMode} />
        <View style={styles.bestNewSongsList}>
          {(bestNewSection?.tracks || heroSection?.tracks || []).slice(0, 10).map((track) => (
            <TrackItem 
              key={track.id} 
              track={track} 
              onPress={() => handleTrackPress(track, bestNewSection?.tracks || heroSection?.tracks || [])} 
              onMore={() => setTrackMenu(track)}
              themeMode={themeMode}
            />
          ))}
        </View>

        {/* Other Sections */}
        {sections.slice(1, 4).map((section) => (
          <View key={section.key} style={styles.standardSection}>
            <SectionHeader title={section.title} themeMode={themeMode} />
            <FlatList
              data={section.tracks.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${section.key}_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                   style={[styles.simpleTrackCard, {
                     backgroundColor: theme.surface,
                     shadowColor: themeMode === 'dark' ? 'transparent' : '#B8A990',
                     borderWidth: themeMode === 'dark' ? 1 : 0,
                     borderColor: theme.outline,
                   }]}
                   onPress={() => handleTrackPress(item, section.tracks)}
                >
                   <Image source={{ uri: item.artwork }} style={styles.simpleTrackImage} />
                   <Text style={[styles.simpleTrackTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
                   <Text style={[styles.simpleTrackArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ))}

        <MadeInIndiaFooter />
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Track Menu */}
      {trackMenu && (
        <BottomSheetMenu
          visible={!!trackMenu}
          onClose={() => setTrackMenu(null)}
          title={trackMenu.title}
          subtitle={trackMenu.artist}
          artwork={trackMenu.artwork}
          options={[
            {
              icon: isLiked(trackMenu.id) ? 'favorite' : 'favorite-border',
              label: isLiked(trackMenu.id) ? 'Remove from Liked' : 'Add to Liked Songs',
              color: isLiked(trackMenu.id) ? theme.error : theme.primary,
              onPress: () => {
                const wasLiked = isLiked(trackMenu.id);
                toggleLike(trackMenu);
                showToast(wasLiked ? 'Removed from Liked' : 'Added to Liked Songs');
              },
            },
            {
              icon: 'queue-music',
              label: 'Add to Queue',
              onPress: () => {
                addToQueue(trackMenu);
                showToast('Added to queue');
              },
            },
            {
              icon: 'share',
              label: 'Share',
              onPress: () => {
                shareSong(trackMenu);
              },
            },
            {
              icon: useLibraryStore.getState().isDownloaded(trackMenu.id) ? 'file-download-done' : 'file-download',
              label: useLibraryStore.getState().isDownloaded(trackMenu.id) ? 'Downloaded' : 'Download',
              onPress: async () => {
                if (useLibraryStore.getState().isDownloaded(trackMenu.id)) {
                  showToast('Already downloaded');
                  return;
                }
                showToast('Starting download...');
                try {
                  const { downloadService } = require('../services/downloadService');
                  await downloadService.downloadTrack(trackMenu);
                  showToast('Download complete!');
                } catch (e) {
                  showToast('Download failed');
                }
              },
            },
          ]}
        />
      )}
      <FirstTimeTooltip screen="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingSub: { ...typography.labelLg, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  greeting: { ...typography.headlineLg, fontWeight: '800' },
  profileButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 24 },
  sectionTitle: { ...typography.headlineMd, fontWeight: '800' },
  seeAllText: { ...typography.labelLg },
  horizontalList: { gap: 16 },
  playlistPill: { width: 220, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
  playlistPillImage: { width: '100%', height: 220 },
  playlistPillInfo: { padding: 14 },
  playlistPillTitle: { ...typography.titleMd, fontWeight: '700' },
  playlistPillMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  playlistPillSubtitle: { ...typography.labelSm, letterSpacing: 1.5 },
  playIconTiny: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bestNewSongsList: { gap: 8, marginTop: 8 },
  trackItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    gap: 14,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  trackRowImage: { width: 52, height: 52, borderRadius: 12 },
  trackRowInfo: { flex: 1 },
  trackRowTitle: { ...typography.titleSm, fontWeight: '700' },
  trackRowArtist: { ...typography.bodySm, marginTop: 3 },
  standardSection: { marginTop: 12 },
  simpleTrackCard: { width: 150, borderRadius: 16, overflow: 'hidden', paddingBottom: 12, elevation: 3, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
  simpleTrackImage: { width: 150, height: 150, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  simpleTrackTitle: { ...typography.titleSm, fontWeight: '700', marginTop: 10, paddingHorizontal: 10 },
  simpleTrackArtist: { ...typography.bodySm, paddingHorizontal: 10, marginTop: 2 },
});
