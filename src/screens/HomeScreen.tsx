import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, ToastAndroid, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
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
    <TouchableOpacity style={[styles.playlistPill, { backgroundColor: theme.surfaceContainer }]} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: playlist.artwork }} style={styles.playlistPillImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.playlistPillOverlay}
      >
        <Text style={[styles.playlistPillTitle, { color: '#FFF' }]} numberOfLines={1}>{playlist.title}</Text>
        <View style={styles.playlistPillMeta}>
          <Text style={[styles.playlistPillSubtitle, { color: '#A5A5C7' }]} numberOfLines={1}>MUSIC FOR YOU</Text>
          <View style={[styles.playIconTiny, { backgroundColor: theme.primary }]}>
             <MaterialIcon name="play-arrow" size={14} color="#FFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GlassTrackItem({ track, onPress, onMore, themeMode }: { track: Track; onPress: () => void; onMore?: () => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={[styles.glassTrackContainer, { borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <BlurView intensity={25} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.glassTrackBlur}>
        <TouchableOpacity style={styles.trackRow} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.trackArtworkContainer}>
            <Image source={{ uri: track.artwork }} style={styles.trackRowImage} />
            <View style={[styles.trackPlayButtonOverlay, { backgroundColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.8)' : 'rgba(99, 102, 241, 0.8)' }]}>
               <MaterialIcon name="play-arrow" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.trackRowInfo}>
            <Text style={[styles.trackRowTitle, { color: theme.onSurface }]} numberOfLines={1}>{track.title}</Text>
            <Text style={[styles.trackRowArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{track.artist}</Text>
          </View>
          <TouchableOpacity onPress={onMore} hitSlop={{ top: 10, bottom: 10 }}>
            <MaterialIcon name="more-horiz" size={20} color={theme.onSurfaceVariant} />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </View>
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
    // Pick two random seeds to search for playlists
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

    // Shuffle playlists so they feel fresh each time
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

    // Global Deduplication & Filtering
    const cleanPool = deduplicateTracks(allFetchedTracks);
    const seenIds = new Set<string>();

    trackFetchers.forEach((f, i) => {
      const result = trackResults[i];
      if (result.status === 'fulfilled') {
        // Filter result tracks against the clean/deduplicated pool and ensure no cross-section overlap
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
          // Mark these tracks as 'seen' so they don't appear in the NEXT section
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
        <LinearGradient
          colors={themeMode === 'dark' ? ['#4F39CC', '#16162E', theme.background] : ['#A5B4FC', '#FFFFFF', theme.background]}
          style={StyleSheet.absoluteFill}
        />
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
      <LinearGradient
        colors={themeMode === 'dark' ? ['#4F39CC', '#16162E', theme.background] : ['#A5B4FC', '#FFFFFF', theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: theme.onSurface }]}>Today</Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { backgroundColor: 'transparent' }]} onPress={() => navigation.navigate('Settings')}>
             <LinearGradient colors={selectedAvatar.bg} style={[styles.profileCircle, { borderWidth: 1, borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
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
            <GlassTrackItem 
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
                   style={styles.simpleTrackCard} 
                   onPress={() => handleTrackPress(item, section.tracks)}
                >
                   <Image source={{ uri: item.artwork }} style={styles.simpleTrackImage} />
                   <Text style={[styles.simpleTrackTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
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
              color: isLiked(trackMenu.id) ? '#EF4444' : theme.primary,
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
  greeting: { ...typography.displaySm, fontWeight: '800' },
  profileButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  profileCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 24 },
  sectionTitle: { ...typography.headlineMd, fontWeight: '800' },
  seeAllText: { ...typography.labelLg },
  horizontalList: { gap: 16 },
  playlistPill: { width: 260, height: 320, borderRadius: 32, overflow: 'hidden' },
  playlistPillImage: { width: '100%', height: '100%' },
  playlistPillOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, height: '40%', justifyContent: 'flex-end' },
  playlistPillTitle: { ...typography.headlineMd, fontWeight: '800' },
  playlistPillMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  playlistPillSubtitle: { ...typography.labelSm, letterSpacing: 2 },
  playIconTiny: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bestNewSongsList: { gap: 12, marginTop: 8 },
  glassTrackContainer: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  glassTrackBlur: { padding: 12 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  trackArtworkContainer: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  trackRowImage: { width: 56, height: 56, borderRadius: 16 },
  trackPlayButtonOverlay: { position: 'absolute', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  trackRowInfo: { flex: 1 },
  trackRowTitle: { ...typography.titleMd, fontWeight: '700' },
  trackRowArtist: { ...typography.bodySm, marginTop: 4 },
  standardSection: { marginTop: 12 },
  simpleTrackCard: { width: 140 },
  simpleTrackImage: { width: 140, height: 140, borderRadius: 24, marginBottom: 8 },
  simpleTrackTitle: { ...typography.labelLg, textAlign: 'center' },
});
