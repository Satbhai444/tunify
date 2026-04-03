import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Share,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu } from '../components/BottomSheet';
import { usePlayerStore, useLibraryStore } from '../stores';
import type { Track } from '../types';
import { getPlaylistDetails } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 320;

export function PlaylistDetailScreen({ route, navigation }: any) {
  const { playlistId, title, artwork, description } = route.params || {};
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFav, setIsFav] = React.useState(false);
  const [trackMenu, setTrackMenu] = React.useState<Track | null>(null);
  const [playlistMenuVisible, setPlaylistMenuVisible] = React.useState(false);
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);

  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylistStore = useLibraryStore((s) => s.addToPlaylist);
  const getPlaylistTracks = useLibraryStore((s) => s.getPlaylistTracks);
  const downloads = useLibraryStore((s) => s.downloads);
  // Subscribe to track cache changes so list updates reactively
  const playlistTracks = useLibraryStore((s) => s.playlistTracks);

  // Check if this is a user-created playlist or downloads view
  const isUserPlaylist = playlistId?.startsWith('pl_');
  const isDownloadsView = playlistId === '__downloads__';

  function showToast(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }

  React.useEffect(() => {
    loadPlaylist();
  }, [playlistId, playlistTracks, downloads]);

  async function loadPlaylist() {
    setLoading(true);
    if (isDownloadsView) {
      // Show downloaded tracks directly
      setTracks(downloads as Track[]);
      setLoading(false);
      return;
    }
    if (isUserPlaylist) {
      // Resolve tracks from the store cache
      const resolved = getPlaylistTracks(playlistId);
      setTracks(resolved);
      setLoading(false);
      return;
    }
    // API playlist (e.g. from HomeScreen sections)
    try {
      const data = await getPlaylistDetails(playlistId);
      if (data?.tracks) {
        setTracks(data.tracks);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handlePlayTrack(track: Track, index: number) {
    play(track, tracks);
  }

  function handlePlayAll() {
    if (tracks.length > 0) {
      play(tracks[0], tracks);
    }
  }

  function handleShufflePlay() {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      play(shuffled[0], shuffled);
    }
  }

  function handleSharePlaylist() {
    Share.share({
      message: `\ud83c\udfb5 Check out the playlist "${title || 'Playlist'}" on Tunify! ${tracks.length} amazing songs.`,
    });
  }

  function handlePlaylistMore() {
    setPlaylistMenuVisible(true);
  }

  function handleTrackMore(track: Track) {
    setTrackMenu(track);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
        ListFooterComponent={<MadeInIndiaFooter />}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.hero}>
              {artwork ? (
                <Image
                  source={{ uri: artwork }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  blurRadius={40}
                />
              ) : null}
              <LinearGradient
                colors={['transparent', colors.background]}
                style={StyleSheet.absoluteFillObject}
              />
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>
                <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
              </TouchableOpacity>
              <View style={styles.heroContent}>
                {artwork ? (
                  <Image source={{ uri: artwork }} style={styles.heroArt} contentFit="cover" />
                ) : tracks.length >= 4 ? (
                  <View style={[styles.heroArt, { overflow: 'hidden' }]}>  
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                      <Image source={{ uri: tracks[0].artwork }} style={{ flex: 1 }} contentFit="cover" />
                      <Image source={{ uri: tracks[1].artwork }} style={{ flex: 1 }} contentFit="cover" />
                    </View>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                      <Image source={{ uri: tracks[2].artwork }} style={{ flex: 1 }} contentFit="cover" />
                      <Image source={{ uri: tracks[3].artwork }} style={{ flex: 1 }} contentFit="cover" />
                    </View>
                  </View>
                ) : tracks.length > 0 ? (
                  <Image source={{ uri: tracks[0].artwork }} style={styles.heroArt} contentFit="cover" />
                ) : (
                  <View style={[styles.heroArt, { backgroundColor: colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialIcon name="queue-music" size={48} color={colors.onSurfaceVariant} />
                  </View>
                )}
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {title || 'Playlist'}
                </Text>
                {description ? (
                  <Text style={styles.heroDescription} numberOfLines={2}>
                    {description}
                  </Text>
                ) : null}
                <Text style={styles.trackCount}>{tracks.length} songs</Text>
              </View>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => { setIsFav(!isFav); showToast(isFav ? 'Removed from Library' : 'Added to Library'); }}>
                  <MaterialIcon name={isFav ? 'favorite' : 'favorite-border'} size={28} color={isFav ? colors.primary : colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showToast('Downloads coming soon!')}>
                  <MaterialIcon name="cloud-download" size={28} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePlaylistMore}>
                  <MaterialIcon name="more-vert" size={28} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <View style={styles.playButtons}>
                <TouchableOpacity style={styles.shuffleBtn} onPress={handleShufflePlay}>
                  <MaterialIcon name="shuffle" size={22} color={colors.onSurface} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
                  <MaterialIcon name="play-arrow" size={30} color={colors.onPrimaryContainer} />
                </TouchableOpacity>
              </View>
            </View>

            {loading && (
              <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center', marginVertical: 24 }]}>
                Loading tracks...
              </Text>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const isActive = currentTrack?.id === item.id;
          return (
            <TouchableOpacity
              style={styles.trackRow}
              onPress={() => handlePlayTrack(item, index)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.artwork }} style={styles.trackArt} contentFit="cover" />
              <View style={styles.trackInfo}>
                <Text
                  style={[styles.trackTitle, isActive && { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              {isActive && (
                <MaterialIcon name="equalizer" size={20} color={colors.primary} />
              )}
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleTrackMore(item)}
              >
                <MaterialIcon name="more-vert" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {/* Playlist More Menu */}
      <BottomSheetMenu
        visible={playlistMenuVisible}
        onClose={() => setPlaylistMenuVisible(false)}
        title={title || 'Playlist'}
        subtitle={`${tracks.length} songs`}
        artwork={artwork}
        options={[
          { icon: 'shuffle', label: 'Shuffle Play', onPress: handleShufflePlay },
          {
            icon: 'playlist-add',
            label: 'Add All to Queue',
            sublabel: `${tracks.length} songs`,
            onPress: () => {
              tracks.forEach((t) => addToQueue(t));
              showToast(`Added ${tracks.length} songs to queue`);
            },
          },
          { icon: 'share', label: 'Share Playlist', onPress: handleSharePlaylist },
        ]}
      />

      {/* Track More Menu */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: spacing.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14,14,14,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  heroArt: {
    width: 160,
    height: 160,
    borderRadius: radii.md,
    marginBottom: 16,
  },
  heroTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroDescription: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
    marginTop: 4,
  },
  trackCount: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  playButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAllBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  trackArtist: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});
