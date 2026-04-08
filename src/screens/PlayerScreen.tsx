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
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { haptics, downloadTrack } from '../utils/platform';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { BottomSheetMenu, PlaylistPicker, QueueViewer } from '../components/BottomSheet';
import { usePlayerStore, useLibraryStore } from '../stores';
import { getSyncedLyrics, SyncedLyricLine } from '../api/lrclib';
import { getArtistInfo, getArtistTopTracks, LastFmArtistInfo, LastFmTopTrack } from '../api/lastfm';
import { searchSongs } from '../api/musicService';
import { Track } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ART_SIZE = SCREEN_WIDTH * 0.8;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
    play,
  } = usePlayerStore();

  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);

  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const [menuVisible, setMenuVisible] = React.useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = React.useState(false);
  const [queueVisible, setQueueVisible] = React.useState(false);
  const [syncedLyrics, setSyncedLyrics] = React.useState<SyncedLyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = React.useState(-1);
  const [lyricsLoading, setLyricsLoading] = React.useState(false);
  const [artistInfo, setArtistInfo] = React.useState<LastFmArtistInfo | null>(null);

  const artScale = React.useRef(new Animated.Value(1)).current;

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      console.log(msg);
    }
  };

  // ─── Album art scale animation on play/pause ───
  React.useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.9,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  // ─── Fetch synced lyrics ───
  React.useEffect(() => {
    if (!currentTrack) return;
    setSyncedLyrics([]);
    setLyricsLoading(true);
    getSyncedLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration)
      .then(setSyncedLyrics)
      .catch(() => {})
      .finally(() => setLyricsLoading(false));
  }, [currentTrack?.id]);

  // ─── Haptic helpers ───
  const handlePlayPause = async () => {
    haptics.impact('medium');
    await togglePlayPause();
  };

  const handleLike = () => {
    if (!currentTrack) return;
    haptics.impact('light');
    toggleLike(currentTrack);
  };

  if (!currentTrack) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Premium Gradient Background */}
      <LinearGradient
        colors={['#4F39CC', '#16162E', '#0D0D1F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <MaterialIcon name="keyboard-arrow-down" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{currentTrack.album || 'Now Playing'}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIcon}>
          <MaterialIcon name="more-horiz" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Centered Artwork with Glass Shadow */}
        <View style={styles.artworkWrapper}>
          <Animated.View style={[styles.artContainer, { transform: [{ scale: artScale }] }]}>
            <Image
              source={{ uri: currentTrack.artwork }}
              style={styles.albumArt}
              contentFit="cover"
              transition={300}
            />
          </Animated.View>
        </View>

        {/* Track Details */}
        <View style={styles.trackDetails}>
          <View style={styles.titleArtist}>
            <Text style={styles.titleText} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artistText} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity onPress={handleLike}>
            <MaterialIcon 
              name={liked ? 'favorite' : 'favorite-border'} 
              size={32} 
              color={liked ? colors.primary : '#A5A5C7'} 
            />
          </TouchableOpacity>
        </View>

        {/* Slider Section */}
        <View style={styles.sliderSection}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onSlidingComplete={seekTo}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor="rgba(255,255,255,0.1)"
            thumbTintColor="#FFF"
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Floating Glass Control Panel */}
        <View style={styles.controlsWrapper}>
          <BlurView intensity={30} tint="dark" style={styles.controlsPanel}>
            <TouchableOpacity onPress={toggleShuffle}>
              <MaterialIcon name="shuffle" size={26} color={isShuffled ? colors.primary : '#A5A5C7'} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={skipPrevious}>
              <MaterialIcon name="skip-previous" size={40} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              <LinearGradient colors={['#7B61FF', '#4F39CC']} style={styles.playGradient}>
                {isBuffering ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <MaterialIcon name={isPlaying ? 'pause' : 'play-arrow'} size={44} color="#FFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={skipNext}>
              <MaterialIcon name="skip-next" size={40} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat}>
              <MaterialIcon 
                name={repeatMode === 'one' ? 'repeat-one' : 'repeat'} 
                size={26} 
                color={repeatMode !== 'off' ? colors.primary : '#A5A5C7'} 
              />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity onPress={() => setQueueVisible(true)} style={styles.iconButton}>
             <MaterialIcon name="queue-music" size={24} color="#A5A5C7" />
             <Text style={styles.iconButtonText}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Share.share({ message: `Listening to ${currentTrack.title}` })} style={styles.iconButton}>
             <MaterialIcon name="share" size={24} color="#A5A5C7" />
             <Text style={styles.iconButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconButton}>
             <MaterialIcon name="playlist-add" size={24} color="#A5A5C7" />
             <Text style={styles.iconButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Lyrics Glass Panel */}
        {syncedLyrics.length > 0 && (
          <View style={styles.lyricsWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.lyricsCard}>
              <Text style={styles.lyricsHeader}>Lyrics</Text>
              <ScrollView nestedScrollEnabled style={{ height: 200 }}>
                 {syncedLyrics.map((l, i) => (
                   <Text 
                    key={i} 
                    style={[
                      styles.lyricLine, 
                      position >= l.time && styles.activeLyric
                    ]}
                   >
                     {l.text}
                   </Text>
                 ))}
              </ScrollView>
            </BlurView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={currentTrack.title}
        subtitle={currentTrack.artist}
        artwork={currentTrack.artwork}
        options={[
          {
            icon: liked ? 'favorite' : 'favorite-border',
            label: liked ? 'Remove from Liked' : 'Add to Liked Songs',
            color: liked ? colors.error : colors.primary,
            onPress: handleLike,
          },
          {
            icon: 'playlist-add',
            label: 'Add to Playlist',
            onPress: () => setTimeout(() => setPlaylistPickerVisible(true), 300),
          },
          {
            icon: 'download-for-offline',
            label: useLibraryStore.getState().isDownloaded(currentTrack.id) ? 'Downloaded' : 'Download',
            onPress: async () => {
              if (useLibraryStore.getState().isDownloaded(currentTrack.id)) return;
              showToast('Downloading...');
              const res = await downloadTrack(currentTrack.url, currentTrack.id, currentTrack.title);
              if (res) {
                useLibraryStore.getState().addDownload({
                  ...currentTrack,
                  localPath: res.uri,
                  downloadedAt: Date.now(),
                  fileSize: res.size,
                });
                showToast('Downloaded successfully!');
              }
            },
          },
          {
             icon: 'share',
             label: 'Share Song',
             onPress: () => Share.share({ message: `Check out ${currentTrack.title} on Tunify!` }),
          },
        ]}
      />
      
      <PlaylistPicker
        visible={playlistPickerVisible}
        onClose={() => setPlaylistPickerVisible(false)}
        playlists={playlists.map(p => ({ id: p.id, title: p.title, trackCount: p.trackIds.length }))}
        onSelect={(id) => {
          addToPlaylist(id, currentTrack);
          showToast('Added to playlist');
        }}
        onCreate={async (name) => {
          const pl = await useLibraryStore.getState().createPlaylist(name);
          addToPlaylist(pl.id, currentTrack);
          showToast(`Created "${name}" and added song`);
        }}
      />

      <QueueViewer
        visible={queueVisible}
        onClose={() => setQueueVisible(false)}
        queue={queue}
        currentTrackId={currentTrack.id}
        onPlayTrack={(i) => play(queue[i], queue)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    height: 100,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.labelLg,
    color: '#A5A5C7',
    maxWidth: SCREEN_WIDTH - 120,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  artworkWrapper: {
    alignItems: 'center',
    marginVertical: 30,
  },
  artContainer: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  trackDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  titleArtist: {
    flex: 1,
    paddingRight: 20,
  },
  titleText: {
    ...typography.displaySm,
    color: '#FFF',
    fontWeight: '800',
  },
  artistText: {
    ...typography.titleMd,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  sliderSection: {
    marginBottom: 30,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  timeText: {
    ...typography.labelMd,
    color: '#A5A5C7',
  },
  controlsWrapper: {
    marginBottom: 40,
  },
  controlsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  playGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  iconButton: {
    alignItems: 'center',
    gap: 6,
  },
  iconButtonText: {
    ...typography.labelSm,
    color: '#A5A5C7',
  },
  lyricsWrapper: {
    marginBottom: 40,
  },
  lyricsCard: {
    padding: 24,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lyricsHeader: {
    ...typography.titleMd,
    color: '#FFF',
    marginBottom: 16,
    fontWeight: '800',
  },
  lyricLine: {
    ...typography.headlineMd,
    color: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
    fontSize: 24,
  },
  activeLyric: {
    color: '#FFF',
  },
});
