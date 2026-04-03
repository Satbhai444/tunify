import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  ToastAndroid,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { haptics, downloadTrack } from '../utils/platform';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu, PlaylistPicker, QueueViewer } from '../components/BottomSheet';
import { usePlayerStore, useLibraryStore } from '../stores';
import { getLyrics, searchSongs } from '../api/musicService';
import { getSyncedLyrics, SyncedLyricLine } from '../api/lrclib';
import { getArtistInfo, getArtistTopTracks, LastFmArtistInfo, LastFmTopTrack } from '../api/lastfm';
import { LyricLine } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ART_SIZE = SCREEN_WIDTH - 80;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNumber(n: string): string {
  const num = parseInt(n, 10);
  if (isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return n;
}

export function PlayerScreen({ navigation }: any) {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    position,
    duration,
    repeatMode,
    isShuffled,
    queue,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    toggleRepeat,
    toggleShuffle,
    addToQueue,
    applyEqPreset,
    play,
  } = usePlayerStore();

  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);

  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  // --- Modal states ---
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = React.useState(false);
  const [queueVisible, setQueueVisible] = React.useState(false);
  const [sleepTimerVisible, setSleepTimerVisible] = React.useState(false);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = React.useState<number | null>(null);
  const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = React.useState(0);
  const [eqVisible, setEqVisible] = React.useState(false);
  const [eqPreset, setEqPreset] = React.useState<'flat' | 'bass' | 'treble' | 'vocal'>('flat');
  const sleepTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const [fullLyricsVisible, setFullLyricsVisible] = React.useState(false);
  const fullLyricsScrollRef = React.useRef<ScrollView>(null);

  // --- Dynamic gradient ---
  const [gradientColors, setGradientColors] = React.useState<[string, string, string]>([
    'rgba(14,14,14,0.95)',
    'rgba(14,14,14,0.98)',
    colors.background,
  ]);

  // --- Synced lyrics ---
  const [syncedLyrics, setSyncedLyrics] = React.useState<SyncedLyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = React.useState(false);
  const [showLyricsSection, setShowLyricsSection] = React.useState(false);
  const lyricsScrollRef = React.useRef<ScrollView>(null);
  const [activeLyricIndex, setActiveLyricIndex] = React.useState(-1);

  // --- Artist info ---
  const [artistInfo, setArtistInfo] = React.useState<LastFmArtistInfo | null>(null);
  const [artistTopTracks, setArtistTopTracks] = React.useState<LastFmTopTrack[]>([]);
  const [artistLoading, setArtistLoading] = React.useState(false);

  // --- Similar tracks ("You might also like") ---
  const [similarTracks, setSimilarTracks] = React.useState<Track[]>([]);

  // --- Album art animation ---
  const artScale = React.useRef(new Animated.Value(1)).current;

  // ─── Generate dynamic gradient color from track ID (deterministic) ───
  React.useEffect(() => {
    if (!currentTrack?.id) return;
    // Generate a pleasant color from track ID hash
    let hash = 0;
    const str = currentTrack.id + (currentTrack.artist || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const sat = 30 + (Math.abs(hash >> 8) % 30);  // 30-60%
    const lit = 15 + (Math.abs(hash >> 16) % 15);  // 15-30%
    const dominant = `hsl(${hue}, ${sat}%, ${lit}%)`;
    const dimmer = `hsl(${hue}, ${Math.max(10, sat - 15)}%, ${Math.max(8, lit - 8)}%)`;
    setGradientColors([dominant, dimmer, colors.background]);
  }, [currentTrack?.id, currentTrack?.artist]);

  // ─── Fetch synced lyrics ───
  React.useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    setSyncedLyrics([]);
    setShowLyricsSection(false);
    setActiveLyricIndex(-1);
    setLyricsLoading(true);
    (async () => {
      try {
        const lines = await getSyncedLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration);
        if (cancelled) return;
        setSyncedLyrics(lines);
        if (lines.length > 0) setShowLyricsSection(true);
      } catch { /* ignore */ }
      finally { if (!cancelled) setLyricsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [currentTrack?.id]);

  // ─── Fetch artist info ───
  React.useEffect(() => {
    if (!currentTrack?.artist) return;
    let cancelled = false;
    setArtistInfo(null);
    setArtistTopTracks([]);
    setArtistLoading(true);
    (async () => {
      try {
        const [info, tracks] = await Promise.all([
          getArtistInfo(currentTrack.artist),
          getArtistTopTracks(currentTrack.artist, 5),
        ]);
        if (cancelled) return;
        setArtistInfo(info);
        setArtistTopTracks(tracks);
      } catch { /* ignore */ }
      finally { if (!cancelled) setArtistLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [currentTrack?.artist]);

  // ─── Fetch similar tracks ("You might also like") ───
  React.useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    setSimilarTracks([]);
    (async () => {
      try {
        const query = `${currentTrack.artist} ${currentTrack.title} similar songs`;
        const results = await searchSongs(query);
        if (cancelled) return;
        const filtered = results.filter((t: Track) => t.id !== currentTrack.id).slice(0, 10);
        setSimilarTracks(filtered);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [currentTrack?.id]);

  // ─── Album art scale animation on play/pause ───
  React.useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.92,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  // ─── Active lyric tracking ───
  React.useEffect(() => {
    if (syncedLyrics.length === 0) return;
    let idx = -1;
    for (let i = syncedLyrics.length - 1; i >= 0; i--) {
      if (position >= syncedLyrics[i].time) {
        idx = i;
        break;
      }
    }
    if (idx !== activeLyricIndex) {
      setActiveLyricIndex(idx);
    }
  }, [position, syncedLyrics]);

  // ─── Toast helper ───
  function showToast(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }

  // ─── Haptic play/pause ───
  async function handlePlayPause() {
    haptics.impact('medium');
    await togglePlayPause();
  }

  // ─── Haptic like ───
  function handleLike() {
    if (!currentTrack) return;
    haptics.impact('light');
    toggleLike(currentTrack);
    showToast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
  }

  function handleShare() {
    if (!currentTrack) return;
    Share.share({
      message: `🎵 Listen to "${currentTrack.title}" by ${currentTrack.artist} on Tunify!`,
    });
  }

  // ─── Sleep timer logic ───
  function clearSleepTimer() {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerEndsAt(null);
    setSleepTimerSecondsLeft(0);
    showToast('Sleep timer cleared');
  }

  function setSleepTimer(minutes: number) {
    const endAt = Date.now() + minutes * 60 * 1000;
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerEndsAt(endAt);
    setSleepTimerSecondsLeft(minutes * 60);

    sleepTimerRef.current = setInterval(async () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setSleepTimerSecondsLeft(left);
      if (left <= 0) {
        if (sleepTimerRef.current) {
          clearInterval(sleepTimerRef.current);
          sleepTimerRef.current = null;
        }
        setSleepTimerEndsAt(null);
        setSleepTimerSecondsLeft(0);
        await togglePlayPause();
        showToast('Sleep timer ended, playback paused');
      }
    }, 1000);

    showToast(`Sleep timer set for ${minutes} min`);
  }

  React.useEffect(() => {
    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    };
  }, []);

  // ─── Next track in queue ───
  const nextTrack = React.useMemo(() => {
    if (!currentTrack || queue.length === 0) return null;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx >= 0 && idx < queue.length - 1) return queue[idx + 1];
    return null;
  }, [currentTrack?.id, queue]);

  // ─── Menu options (same as before) ───
  const menuOptions = currentTrack
    ? [
        {
          icon: liked ? 'favorite' : 'favorite-border',
          label: liked ? 'Remove from Liked Songs' : 'Add to Liked Songs',
          onPress: handleLike,
          color: liked ? colors.error : colors.primary,
        },
        {
          icon: 'playlist-add',
          label: 'Add to Playlist',
          sublabel: `${playlists.length} playlists`,
          onPress: () => setTimeout(() => setPlaylistPickerVisible(true), 300),
        },
        {
          icon: 'queue-music',
          label: 'Add to Queue',
          onPress: () => {
            addToQueue(currentTrack);
            showToast('Added to queue');
          },
        },
        {
          icon: 'share',
          label: 'Share',
          sublabel: 'Send to friends',
          onPress: handleShare,
        },
        {
          icon: 'download-for-offline',
          label: downloading ? 'Downloading...' : useLibraryStore.getState().isDownloaded(currentTrack.id) ? 'Already Downloaded' : 'Download',
          sublabel: 'Save for offline listening',
          onPress: async () => {
            if (downloading) return;
            if (useLibraryStore.getState().isDownloaded(currentTrack.id)) {
              showToast('Already downloaded');
              return;
            }
            if (!currentTrack.url) {
              showToast('No download URL available');
              return;
            }
            setDownloading(true);
            showToast('Downloading...');
            try {
              const result = await downloadTrack(currentTrack.url, currentTrack.id, currentTrack.title);
              if (result) {
                const addDownload = useLibraryStore.getState().addDownload;
                addDownload({
                  ...currentTrack,
                  localPath: result.uri,
                  downloadedAt: Date.now(),
                  fileSize: result.size,
                });
                showToast('Downloaded successfully!');
              } else {
                showToast('Download failed');
              }
            } catch (e) {
              console.error('Download error:', e);
              showToast('Download failed');
            } finally {
              setDownloading(false);
            }
          },
        },
        {
          icon: 'timer',
          label: 'Sleep Timer',
          sublabel: sleepTimerEndsAt ? `${Math.ceil(sleepTimerSecondsLeft / 60)} min left` : 'Pause after a delay',
          onPress: () => setSleepTimerVisible(true),
        },
        {
          icon: 'equalizer',
          label: 'Equalizer',
          sublabel: `Preset: ${eqPreset.toUpperCase()}`,
          onPress: () => setEqVisible(true),
        },
        {
          icon: 'album',
          label: 'Go to Album',
          sublabel: currentTrack.album || 'Unknown',
          onPress: () => {
            if (currentTrack.albumId) {
              navigation.navigate('AlbumDetail', {
                albumId: currentTrack.albumId,
                albumName: currentTrack.album,
                albumArtwork: currentTrack.artwork,
              });
            } else {
              showToast('Album info not available');
            }
          },
        },
        {
          icon: 'person',
          label: 'Go to Artist',
          sublabel: currentTrack.artist,
          onPress: () => {
            if (currentTrack.artistId) {
              navigation.navigate('ArtistDetail', {
                artistId: currentTrack.artistId,
                artistName: currentTrack.artist,
                artistImage: '',
              });
            } else {
              showToast('Artist info not available');
            }
          },
        },
        {
          icon: 'radio',
          label: 'Song Radio',
          sublabel: 'Play similar songs',
          onPress: async () => {
            showToast('Loading Song Radio...');
            try {
              const { getSimilarSongs, getCuratedSection } = require('../api/musicService');
              let similar: any[] = [];
              if (currentTrack.source === 'jiosaavn') {
                similar = await getSimilarSongs(currentTrack.id, 25);
              }
              if (similar.length === 0) {
                similar = await getCuratedSection(`${currentTrack.artist} songs`, 25);
              }
              if (similar.length > 0) {
                play(similar[0], similar);
                showToast(`Radio: ${similar.length} similar songs`);
              } else {
                showToast('No similar songs found');
              }
            } catch {
              showToast('Failed to load Song Radio');
            }
          },
        },
      ]
    : [];

  // ─── Empty state ───
  if (!currentTrack) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcon name="music-off" size={64} color={colors.onSurfaceVariant} />
        <Text style={[typography.titleMd, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
          No track playing
        </Text>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const repeatIcon =
    repeatMode === 'off' ? 'repeat' : repeatMode === 'one' ? 'repeat-one' : 'repeat';
  const repeatColor = repeatMode === 'off' ? colors.onSurfaceVariant : colors.primary;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Dynamic gradient background */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} hitSlop={{ top: 10, bottom: 10 }}>
          <MaterialIcon name="keyboard-arrow-down" size={32} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.playingFrom}>PLAYING FROM</Text>
          <Text style={styles.playingSource} numberOfLines={1}>
            {currentTrack.album || 'Tunify'}
          </Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10 }} onPress={() => setMenuVisible(true)}>
          <MaterialIcon name="more-vert" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Animated Album Art */}
        <Animated.View style={[styles.artContainer, { transform: [{ scale: artScale }] }]}>
          <Image
            source={{ uri: currentTrack.artwork }}
            style={styles.albumArt}
            contentFit="cover"
            transition={300}
          />
        </Animated.View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackInfoText}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLike}>
            <MaterialIcon
              name={liked ? 'favorite' : 'favorite-border'}
              size={26}
              color={liked ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onSlidingComplete={(val) => seekTo(val)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={'rgba(255,255,255,0.15)'}
            thumbTintColor={colors.primary}
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Transport Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={toggleShuffle} hitSlop={{ top: 10, bottom: 10 }}>
            <MaterialIcon
              name="shuffle"
              size={26}
              color={isShuffled ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipPrevious} hitSlop={{ top: 10, bottom: 10 }}>
            <MaterialIcon name="skip-previous" size={40} color={colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} activeOpacity={0.8}>
            {isBuffering ? (
              <ActivityIndicator size={30} color={colors.onPrimaryContainer} />
            ) : (
              <MaterialIcon
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={36}
                color={colors.onPrimaryContainer}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={skipNext} hitSlop={{ top: 10, bottom: 10 }}>
            <MaterialIcon name="skip-next" size={40} color={colors.onSurface} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleRepeat} hitSlop={{ top: 10, bottom: 10 }}>
            <MaterialIcon name={repeatIcon} size={26} color={repeatColor} />
          </TouchableOpacity>
        </View>

        {/* Utility Row */}
        <View style={styles.utilityRow}>
          <TouchableOpacity onPress={() => showToast('No devices found')}>
            <MaterialIcon name="devices" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <MaterialIcon name="share" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setQueueVisible(true)}>
            <MaterialIcon name="queue-music" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* ───────────── INLINE SYNCED LYRICS ───────────── */}
        {showLyricsSection && syncedLyrics.length > 0 && (
          <View style={styles.lyricsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Lyrics</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setFullLyricsVisible(true)}>
                  <MaterialIcon name="fullscreen" size={22} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowLyricsSection(false)}>
                  <MaterialIcon name="close" size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.lyricsCard}>
              <ScrollView
                ref={lyricsScrollRef}
                style={{ maxHeight: 280 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {syncedLyrics.map((line, idx) => (
                  <Text
                    key={`${line.time}_${idx}`}
                    style={[
                      styles.syncedLyricLine,
                      idx === activeLyricIndex && styles.syncedLyricLineActive,
                    ]}
                    onLayout={(e) => {
                      if (idx === activeLyricIndex && lyricsScrollRef.current) {
                        lyricsScrollRef.current.scrollTo({
                          y: Math.max(0, e.nativeEvent.layout.y - 80),
                          animated: true,
                        });
                      }
                    }}
                  >
                    {line.text}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {lyricsLoading && !showLyricsSection && (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 6 }}>Loading lyrics...</Text>
          </View>
        )}

        {/* ───────────── ABOUT THE ARTIST ───────────── */}
        {artistInfo && (
          <View style={styles.artistSection}>
            <Text style={styles.sectionTitle}>About the Artist</Text>
            <View style={styles.artistCard}>
              {artistInfo.image ? (
                <Image
                  source={{ uri: artistInfo.image }}
                  style={styles.artistImage}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.artistMeta}>
                <Text style={styles.artistName}>{artistInfo.name}</Text>
                <View style={styles.artistStatsRow}>
                  <Text style={styles.artistStat}>{formatNumber(artistInfo.listeners)} listeners</Text>
                  <Text style={styles.artistStatDot}>•</Text>
                  <Text style={styles.artistStat}>{formatNumber(artistInfo.playcount)} plays</Text>
                </View>
                {artistInfo.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {artistInfo.tags.slice(0, 3).map((tag) => (
                      <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {artistInfo.bio ? (
                <Text style={styles.artistBio} numberOfLines={4}>
                  {artistInfo.bio}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* ───────────── MORE BY ARTIST ───────────── */}
        {artistTopTracks.length > 0 && (
          <View style={styles.topTracksSection}>
            <Text style={styles.sectionTitle}>More by {currentTrack.artist}</Text>
            {artistTopTracks.map((t, idx) => (
              <View key={`${t.name}_${idx}`} style={styles.topTrackRow}>
                <Text style={styles.topTrackIdx}>{idx + 1}</Text>
                <View style={styles.topTrackInfo}>
                  <Text style={styles.topTrackName} numberOfLines={1}>{t.name}</Text>
                  <Text style={styles.topTrackPlays}>{formatNumber(t.playcount)} plays</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ───────────── YOU MIGHT ALSO LIKE ───────────── */}
        {similarTracks.length > 0 && (
          <View style={styles.topTracksSection}>
            <Text style={styles.sectionTitle}>You Might Also Like</Text>
            <FlatList
              data={similarTracks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `sim_${item.id}`}
              contentContainerStyle={{ gap: 12, marginTop: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ width: 120, alignItems: 'center' }}
                  activeOpacity={0.7}
                  onPress={() => {
                    play(item, similarTracks);
                  }}
                >
                  <Image source={{ uri: item.artwork }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                  <Text style={[typography.bodySm, { color: colors.onSurface, fontWeight: '600', marginTop: 6 }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ───────────── NEXT IN QUEUE ───────────── */}
        {nextTrack && (
          <View style={styles.nextUpSection}>
            <Text style={styles.sectionTitle}>Next in Queue</Text>
            <TouchableOpacity
              style={styles.nextUpCard}
              activeOpacity={0.7}
              onPress={() => setQueueVisible(true)}
            >
              <Image
                source={{ uri: nextTrack.artwork }}
                style={styles.nextUpArt}
                contentFit="cover"
              />
              <View style={styles.nextUpInfo}>
                <Text style={styles.nextUpTitle} numberOfLines={1}>{nextTrack.title}</Text>
                <Text style={styles.nextUpArtist} numberOfLines={1}>{nextTrack.artist}</Text>
              </View>
              <MaterialIcon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── ALL MODALS (unchanged) ─── */}

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={currentTrack.title}
        subtitle={currentTrack.artist}
        artwork={currentTrack.artwork}
        options={menuOptions}
      />

      <PlaylistPicker
        visible={playlistPickerVisible}
        onClose={() => setPlaylistPickerVisible(false)}
        playlists={playlists.map((p) => ({ id: p.id, title: p.title, trackCount: p.trackIds.length }))}
        onSelect={(id) => {
          if (currentTrack) {
            addToPlaylist(id, currentTrack);
            const pl = playlists.find((p) => p.id === id);
            showToast(`Added to ${pl?.title}`);
          }
        }}
        onCreate={async (name) => {
          const createPlaylist = useLibraryStore.getState().createPlaylist;
          const newPl = await createPlaylist(name);
          if (currentTrack) {
            addToPlaylist(newPl.id, currentTrack);
            showToast(`Created "${name}" and added song`);
          }
        }}
      />

      <QueueViewer
        visible={queueVisible}
        onClose={() => setQueueVisible(false)}
        queue={queue}
        currentTrackId={currentTrack.id}
        onPlayTrack={(index) => {
          const track = queue[index];
          if (track) play(track, queue);
        }}
      />

      {/* Sleep Timer Modal */}
      <Modal visible={sleepTimerVisible} transparent animationType="slide" onRequestClose={() => setSleepTimerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSleepTimerVisible(false)}>
          <Pressable style={styles.smallModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sleep Timer</Text>
              <TouchableOpacity onPress={() => setSleepTimerVisible(false)}>
                <MaterialIcon name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>
              {sleepTimerEndsAt ? `Active: ${Math.ceil(sleepTimerSecondsLeft / 60)} min left` : 'Choose timer duration'}
            </Text>
            <View style={styles.timerGrid}>
              {[5, 10, 15, 30, 45, 60].map((min) => (
                <TouchableOpacity
                  key={min}
                  style={styles.timerChip}
                  onPress={() => {
                    setSleepTimer(min);
                    setSleepTimerVisible(false);
                  }}
                >
                  <Text style={styles.timerChipText}>{min} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            {sleepTimerEndsAt && (
              <TouchableOpacity style={styles.clearTimerBtn} onPress={clearSleepTimer}>
                <Text style={styles.clearTimerText}>Clear Timer</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Equalizer Modal */}
      <Modal visible={eqVisible} transparent animationType="slide" onRequestClose={() => setEqVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEqVisible(false)}>
          <Pressable style={[styles.smallModalSheet, { paddingBottom: 28 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Equalizer</Text>
              <TouchableOpacity onPress={() => setEqVisible(false)}>
                <MaterialIcon name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Visual EQ Bars */}
            <View style={styles.eqBarsContainer}>
              {['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'].map((freq, i) => {
                const presetLevels: Record<string, number[]> = {
                  flat: [50, 50, 50, 50, 50],
                  bass: [85, 70, 45, 40, 35],
                  treble: [30, 40, 50, 75, 90],
                  vocal: [35, 55, 80, 60, 40],
                };
                const level = (presetLevels[eqPreset] || presetLevels.flat)[i];
                return (
                  <View key={freq} style={styles.eqBarCol}>
                    <View style={styles.eqBarTrack}>
                      <View style={[styles.eqBarFill, { height: `${level}%` }]} />
                    </View>
                    <Text style={styles.eqBarLabel}>{freq}</Text>
                  </View>
                );
              })}
            </View>

            {/* Presets */}
            <Text style={styles.modalSubTitle}>Presets</Text>
            <View style={styles.eqPresetsRow}>
              {[
                { key: 'flat', label: 'Flat', icon: 'remove' },
                { key: 'bass', label: 'Bass', icon: 'speaker' },
                { key: 'treble', label: 'Treble', icon: 'graphic-eq' },
                { key: 'vocal', label: 'Vocal', icon: 'mic' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.eqPresetChip, eqPreset === p.key && styles.eqPresetChipActive]}
                  onPress={() => {
                    const preset = p.key as 'flat' | 'bass' | 'treble' | 'vocal';
                    setEqPreset(preset);
                    applyEqPreset(preset);
                    showToast(`EQ: ${p.label}`);
                  }}
                >
                  <MaterialIcon
                    name={p.icon as any}
                    size={18}
                    color={eqPreset === p.key ? colors.background : colors.onSurfaceVariant}
                  />
                  <Text style={[styles.eqPresetLabel, eqPreset === p.key && styles.eqPresetLabelActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.eqNote}>Visual representation • Full DSP requires native EAS build</Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full-Screen Lyrics Modal */}
      <Modal visible={fullLyricsVisible} animationType="fade" onRequestClose={() => setFullLyricsVisible(false)}>
        <LinearGradient
          colors={[gradientColors[0], 'rgba(14,14,14,0.99)', colors.background]}
          style={{ flex: 1 }}
        >
          <View style={styles.fullLyricsHeader}>
            <TouchableOpacity onPress={() => setFullLyricsVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcon name="keyboard-arrow-down" size={32} color={colors.onSurface} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ ...typography.titleSm, color: colors.onSurface, fontWeight: '700' }} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={{ ...typography.bodySm, color: colors.onSurfaceVariant }} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            ref={fullLyricsScrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 120, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {syncedLyrics.length > 0 ? (
              syncedLyrics.map((line, idx) => (
                <Text
                  key={`fl_${line.time}_${idx}`}
                  style={[
                    styles.fullLyricLine,
                    idx === activeLyricIndex && styles.fullLyricLineActive,
                  ]}
                  onLayout={(e) => {
                    if (idx === activeLyricIndex && fullLyricsScrollRef.current) {
                      fullLyricsScrollRef.current.scrollTo({
                        y: Math.max(0, e.nativeEvent.layout.y - SCREEN_HEIGHT / 3),
                        animated: true,
                      });
                    }
                  }}
                >
                  {line.text || '♪'}
                </Text>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingTop: 100 }}>
                <MaterialIcon name="music-note" size={48} color={colors.outlineVariant} />
                <Text style={{ ...typography.titleMd, color: colors.onSurfaceVariant, marginTop: 16 }}>
                  No lyrics available
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Mini controls at bottom */}
          <View style={styles.fullLyricsControls}>
            <TouchableOpacity onPress={skipPrevious}>
              <MaterialIcon name="skip-previous" size={28} color={colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.fullLyricsPlayBtn}>
              <MaterialIcon name={isPlaying ? 'pause' : 'play-arrow'} size={32} color={colors.background} />
            </TouchableOpacity>
            <TouchableOpacity onPress={skipNext}>
              <MaterialIcon name="skip-next" size={28} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  playingFrom: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  playingSource: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  artContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  albumArt: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + 8,
    marginBottom: 8,
  },
  trackInfoText: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '800',
  },
  trackArtist: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  progressSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginBottom: 24,
  },

  /* ─── Lyrics Section ─── */
  lyricsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '800',
    marginBottom: 10,
  },
  lyricsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    padding: 16,
    overflow: 'hidden',
  },
  syncedLyricLine: {
    ...typography.bodyLg,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 32,
    marginBottom: 8,
    fontWeight: '600',
  },
  syncedLyricLineActive: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    transform: [{ scale: 1.02 }],
  },

  /* ─── Artist Section ─── */
  artistSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: 20,
  },
  artistCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    padding: 16,
    overflow: 'hidden',
  },
  artistImage: {
    width: '100%',
    height: 160,
    borderRadius: radii.sm,
    marginBottom: 12,
  },
  artistMeta: {
    marginBottom: 8,
  },
  artistName: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '800',
  },
  artistStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  artistStat: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  artistStatDot: {
    color: colors.onSurfaceVariant,
    marginHorizontal: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: 'rgba(114,254,143,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  artistBio: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },

  /* ─── Top Tracks Section ─── */
  topTracksSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: 20,
  },
  topTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topTrackIdx: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    width: 24,
    textAlign: 'center',
  },
  topTrackInfo: {
    flex: 1,
    marginLeft: 10,
  },
  topTrackName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  topTrackPlays: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  /* ─── Next In Queue ─── */
  nextUpSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: 10,
  },
  nextUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    padding: 12,
  },
  nextUpArt: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  nextUpInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nextUpTitle: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  nextUpArtist: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  /* ─── Modals ─── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  smallModalSheet: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '800',
  },
  modalSubTitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  timerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  timerChip: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  timerChipText: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  clearTimerBtn: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,113,81,0.16)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  clearTimerText: {
    ...typography.bodySm,
    color: colors.error,
    fontWeight: '700',
  },
  eqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  eqRowActive: {
    backgroundColor: 'rgba(114,254,143,0.08)',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  eqRowText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  eqRowTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  eqNote: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 14,
    textAlign: 'center',
  },
  eqBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  eqBarCol: {
    alignItems: 'center',
    gap: 6,
  },
  eqBarTrack: {
    width: 28,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  eqBarFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 14,
  },
  eqBarLabel: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  eqPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  eqPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHighest,
  },
  eqPresetChipActive: {
    backgroundColor: colors.primary,
  },
  eqPresetLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  eqPresetLabelActive: {
    color: colors.background,
  },
  // Full-screen lyrics
  fullLyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 8,
  },
  fullLyricLine: {
    fontSize: 26,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    lineHeight: 42,
    marginBottom: 16,
  },
  fullLyricLineActive: {
    color: '#ffffff',
    fontSize: 28,
  },
  fullLyricsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(14,14,14,0.9)',
  },
  fullLyricsPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
