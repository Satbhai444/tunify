import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, Share, ToastAndroid, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu } from '../components/BottomSheet';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { getTrending, getPlaylistTracks, getCuratedSection, getDeezerChart, getNewReleases, getTopPlaylists, getTopArtists, getTopAlbums } from '../api';
import { usePlayerStore, useLibraryStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';
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

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8 }}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Wide Playlist Card matching the "Playlists" section in the image
function PlaylistPill({ playlist, onPress }: { playlist: Playlist; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.playlistPill} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: playlist.artwork }} style={styles.playlistPillImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.playlistPillOverlay}
      >
        <Text style={styles.playlistPillTitle} numberOfLines={1}>{playlist.title}</Text>
        <View style={styles.playlistPillMeta}>
          <Text style={styles.playlistPillSubtitle} numberOfLines={1}>MUSIC FOR YOU</Text>
          <View style={styles.playIconTiny}>
             <MaterialIcon name="play-arrow" size={14} color="#FFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Glass track card matching the "Best new songs" section in the image
function GlassTrackItem({ track, onPress, onMore }: { track: Track; onPress: () => void; onMore?: () => void }) {
  return (
    <View style={styles.glassTrackContainer}>
      <BlurView intensity={25} tint="dark" style={styles.glassTrackBlur}>
        <TouchableOpacity style={styles.trackRow} onPress={onPress} activeOpacity={0.7}>
          <View style={styles.trackArtworkContainer}>
            <Image source={{ uri: track.artwork }} style={styles.trackRowImage} />
            <View style={styles.trackPlayButtonOverlay}>
               <MaterialIcon name="play-arrow" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.trackRowInfo}>
            <Text style={styles.trackRowTitle} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.trackRowArtist} numberOfLines={1}>{track.artist}</Text>
          </View>
          <TouchableOpacity onPress={onMore} hitSlop={{ top: 10, bottom: 10 }}>
            <MaterialIcon name="more-horiz" size={20} color="#A5A5C7" />
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

  function showToast(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }

  const fetchData = useCallback(async () => {
    const trackFetchers = [
      { key: 'trending', title: 'Trending Now', fetcher: getTrending },
      { key: 'bollywood', title: 'Bollywood Hits', fetcher: () => getPlaylistTracks('159144718', 30) },
    ];

    const [trackResults, fPlaylists] = await Promise.all([
      Promise.allSettled(trackFetchers.map((f) => f.fetcher())),
      getTopPlaylists('bollywood party romantic chill', 10).catch(() => [] as Playlist[]),
    ]);

    const newSections: TrackSection[] = [];
    (trackResults as PromiseSettledResult<Track[]>[]).forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        newSections.push({
          key: trackFetchers[i].key,
          title: trackFetchers[i].title,
          tracks: result.value,
        });
      }
    });

    setSections(newSections);
    setFeaturedPlaylists(fPlaylists);
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const heroSection = sections[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F39CC', '#16162E', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header - Transparent/Pill Style */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Today</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.profileCircle}>
               <MaterialIcon name="person" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════ PLAYLISTS (Pills like the image) ═══════ */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Playlists</Text>
        </View>
        <FlatList
          data={featuredPlaylists}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `pill_${item.id}`}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <PlaylistPill playlist={item} onPress={() => handlePlaylistPress(item)} />
          )}
        />

        {/* ═══════ BEST NEW SONGS (List items like the image) ═══════ */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Best new songs</Text>
        </View>
        <View style={styles.bestNewSongsList}>
          {(heroSection?.tracks || []).slice(0, 10).map((track) => (
            <GlassTrackItem 
              key={track.id} 
              track={track} 
              onPress={() => handleTrackPress(track, heroSection?.tracks || [])} 
              onMore={() => setTrackMenu(track)}
            />
          ))}
        </View>

        {/* ═══════ OTHER SECTIONS ═══════ */}
        {sections.slice(1, 4).map((section) => (
          <View key={section.key} style={styles.standardSection}>
            <SectionHeader title={section.title} />
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
                   <Text style={styles.simpleTrackTitle} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ))}

        <MadeInIndiaFooter />
        <View style={{ height: 120 }} />
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
              color: isLiked(trackMenu.id) ? colors.error : colors.primary,
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
                Share.share({
                  message: `🎵 Listen to "${trackMenu.title}" by ${trackMenu.artist} on Tunify!`,
                });
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    ...typography.displaySm,
    color: colors.onSurface,
    fontWeight: '800',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Sections ───
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
  },
  seeAllText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  horizontalList: {
    gap: 16,
  },

  // ─── Playlist Pill (Wide card) ───
  playlistPill: {
    width: 260,
    height: 320,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  playlistPillImage: {
    width: '100%',
    height: '100%',
  },
  playlistPillOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    height: '40%',
    justifyContent: 'flex-end',
  },
  playlistPillTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
  },
  playlistPillMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  playlistPillSubtitle: {
    ...typography.labelSm,
    color: '#A5A5C7',
    letterSpacing: 2,
  },
  playIconTiny: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Glass Track List ───
  bestNewSongsList: {
    gap: 12,
    marginTop: 8,
  },
  glassTrackContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  glassTrackBlur: {
    padding: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trackArtworkContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRowImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  trackPlayButtonOverlay: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123, 97, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRowInfo: {
    flex: 1,
  },
  trackRowTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  trackRowArtist: {
    ...typography.bodySm,
    color: '#A5A5C7',
    marginTop: 4,
  },

  // ─── Standard Section ───
  standardSection: {
    marginTop: 12,
  },
  simpleTrackCard: {
    width: 140,
  },
  simpleTrackImage: {
    width: 140,
    height: 140,
    borderRadius: 24,
    marginBottom: 8,
  },
  simpleTrackTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    textAlign: 'center',
  },
});
