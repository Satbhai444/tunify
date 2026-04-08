import React, { useEffect, useState, useRef } from 'react';
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
import { shareSong, shareLyric } from '../utils/shareUtils';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { BottomSheetMenu, PlaylistPicker, QueueViewer } from '../components/BottomSheet';
import { usePlayerStore, useLibraryStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';
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
  } = usePlayerStore();

  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [playlistPickerVisible, setPlaylistPickerVisible] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);
  const [lyricsModalVisible, setLyricsModalVisible] = useState(false);
  
  const [artistInfo, setArtistInfo] = useState<LastFmArtistInfo | null>(null);
  const [artistTracks, setArtistTracks] = useState<LastFmTopTrack[]>([]);
  
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  const scrollRef = useRef<ScrollView>(null);
  const fullscreenScrollRef = useRef<ScrollView>(null);

  const artScale = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const playGlow = useRef(new Animated.Value(0.4)).current;

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  };

  // ─── Play button pulse glow when playing ───
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(playGlow, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(playGlow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      playGlow.setValue(0.4);
    }
  }, [isPlaying]);

  // ─── Animations for Artwork ───
  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1 : 0.85,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

  // ─── Fetch synced lyrics ───
  useEffect(() => {
    if (!currentTrack) return;
    setLyricsLoading(true);
    getSyncedLyrics(currentTrack.title, currentTrack.artist)
      .then((l) => setLyrics(l))
      .catch((e) => {
        console.error('Lyrics Error:', e);
        setLyrics([]);
      })
      .finally(() => setLyricsLoading(false));

    // Fetch Artist Info
    getArtistInfo(currentTrack.artist).then(setArtistInfo);
    getArtistTopTracks(currentTrack.artist).then(setArtistTracks);
  }, [currentTrack]);

  // ─── Auto-scroll lyrics ───
  useEffect(() => {
    if (!lyrics.length || !isPlaying) return;
    const activeIdx = lyrics.findIndex((l, i) => {
      const next = lyrics[i + 1];
      return position >= l.time && (!next || position < next.time);
    });

    if (activeIdx !== -1) {
      scrollRef.current?.scrollTo({ y: activeIdx * 45, animated: true });
      fullscreenScrollRef.current?.scrollTo({ y: activeIdx * 80, animated: true });
    }
  }, [position, lyrics, isPlaying]);

  // ─── Interaction handlers ───
  const handlePlayPause = async () => {
    haptics.impact('medium');
    Animated.sequence([
      Animated.spring(playBtnScale, { toValue: 0.8, friction: 5, tension: 300, useNativeDriver: true }),
      Animated.spring(playBtnScale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
    await togglePlayPause();
  };

  const handleLike = () => {
    if (!currentTrack) return;
    haptics.impact('light');
    toggleLike(currentTrack);
  };

  const handleDownload = async () => {
    if (!currentTrack) return;
    showToast('Starting download...');
    try {
      await downloadTrack(currentTrack.url, currentTrack.id, currentTrack.title);
      showToast('Downloaded to library');
    } catch (err) {
      showToast('Download failed');
    }
  };

  const currentLyricIdx = lyrics.findIndex((l, i) => {
    const next = lyrics[i + 1];
    return position >= l.time && (!next || position < next.time);
  });

  if (!currentTrack) {
    return <View style={[styles.container, { backgroundColor: theme.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Premium Gradient Background */}
      <LinearGradient
        colors={themeMode === 'dark' ? ['#4F39CC', '#16162E', theme.background] : ['#A5B4FC', '#F8F9FE', theme.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <MaterialIcon name="keyboard-arrow-down" size={32} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]} numberOfLines={1}>{currentTrack.album || 'Now Playing'}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIcon}>
          <MaterialIcon name="more-horiz" size={28} color={theme.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Centered Artwork */}
        <View style={styles.artworkWrapper}>
          <Animated.View style={[styles.artContainer, { transform: [{ scale: artScale }], shadowColor: theme.primary }]}>
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
            <Text style={[styles.titleText, { color: theme.onSurface }]} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={[styles.artistText, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity onPress={handleLike}>
            <MaterialIcon 
              name={liked ? 'favorite' : 'favorite-border'} 
              size={32} 
              color={liked ? theme.error : theme.onSurfaceVariant} 
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
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            thumbTintColor={theme.primary}
          />
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: theme.onSurfaceVariant }]}>{formatTime(position)}</Text>
            <Text style={[styles.timeText, { color: theme.onSurfaceVariant }]}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsWrapper}>
          <BlurView intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.controlsPanel}>
            <TouchableOpacity onPress={toggleShuffle}>
              <MaterialIcon name="shuffle" size={26} color={isShuffled ? theme.primary : theme.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipPrevious}>
              <MaterialIcon name="skip-previous" size={40} color={theme.onSurface} />
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: playBtnScale }] }}>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                <Animated.View style={[styles.playGlow, { backgroundColor: theme.primary, opacity: playGlow }]} />
                <LinearGradient colors={themeMode === 'dark' ? ['#7B61FF', '#4F39CC'] : ['#6366F1', '#4F46E5']} style={styles.playGradient}>
                  {isBuffering ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <MaterialIcon name={isPlaying ? 'pause' : 'play-arrow'} size={44} color="#FFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={skipNext}>
              <MaterialIcon name="skip-next" size={40} color={theme.onSurface} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat}>
              <MaterialIcon 
                name={repeatMode === 'one' ? 'repeat-one' : 'repeat'} 
                size={26} 
                color={repeatMode !== 'off' ? theme.primary : theme.onSurfaceVariant} 
              />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Lyrics Snippet */}
        <TouchableOpacity style={styles.lyricsCard} onPress={() => setLyricsModalVisible(true)}>
           <BlurView intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.lyricsBlur}>
              <Text style={[styles.lyricsLabel, { color: theme.primary }]}>LYRICS</Text>
              <View style={styles.lyricsSnippet}>
                {lyricsLoading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : lyrics.length > 0 ? (
                  <Text style={[styles.lyricsTextSnippet, { color: theme.onSurface }]}>
                    {lyrics[currentLyricIdx]?.text || 'Enjoy the music...'}
                  </Text>
                ) : (
                  <Text style={[styles.lyricsTextSnippet, { color: theme.onSurfaceVariant }]}>Lyrics not available</Text>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.fullscreenBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
                onPress={() => setLyricsModalVisible(true)}
              >
                 <MaterialIcon name="open-in-full" size={16} color={theme.onSurfaceVariant} />
                 <Text style={[styles.fullscreenText, { color: theme.onSurfaceVariant }]}>FULLSCREEN</Text>
              </TouchableOpacity>
           </BlurView>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═══════ Modals ═══════ */}

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={currentTrack.title}
        subtitle={currentTrack.artist}
        artwork={currentTrack.artwork}
        options={[
          { icon: liked ? 'favorite' : 'favorite-border', label: liked ? 'Unlike' : 'Like', color: liked ? theme.error : theme.primary, onPress: handleLike },
          { icon: 'playlist-add', label: 'Add to Playlist', onPress: () => setPlaylistPickerVisible(true) },
          { icon: 'share', label: 'Share Song', onPress: () => shareSong(currentTrack) },
          { icon: 'file-download', label: 'Download', onPress: handleDownload },
          { icon: 'queue-music', label: 'Add to Queue', onPress: () => { addToQueue(currentTrack); showToast('Added to queue'); } },
        ]}
      />

      <Modal visible={lyricsModalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' }]}>
          <TouchableOpacity style={styles.closeLyrics} onPress={() => setLyricsModalVisible(false)}>
            <MaterialIcon name="close" size={32} color={theme.onSurface} />
          </TouchableOpacity>
          
          <ScrollView 
            ref={fullscreenScrollRef}
            contentContainerStyle={styles.fullscreenLyricsList}
            showsVerticalScrollIndicator={false}
          >
            {lyrics.map((l, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => {
                  seekTo(l.time);
                  haptics.impact('light');
                }}
                style={styles.lyricLineBtn}
              >
                <Text style={[
                  styles.fullscreenLyricText,
                  { color: i === currentLyricIdx ? theme.primary : theme.onSurfaceVariant },
                  i === currentLyricIdx && styles.activeLyricText
                ]}>
                  {l.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.lyricShareRow}>
             <TouchableOpacity style={[styles.shareLyricBtn, { backgroundColor: theme.primary }]} onPress={() => shareLyric(currentTrack, lyrics[currentLyricIdx]?.text || '')}>
                <MaterialIcon name="share" size={20} color="#FFF" />
                <Text style={styles.shareLyricTxt}>Share Line</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PlaylistPicker visible={playlistPickerVisible} onClose={() => setPlaylistPickerVisible(false)} track={currentTrack} />
      <QueueViewer visible={queueVisible} onClose={() => setQueueVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, height: 110 },
  headerIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...typography.labelLg, flex: 1, textAlign: 'center', fontWeight: '800', letterSpacing: 1.5 },
  scrollContent: { paddingHorizontal: 20 },
  artworkWrapper: { alignItems: 'center', marginVertical: 30 },
  artContainer: { width: ART_SIZE, height: ART_SIZE, borderRadius: 40, overflow: 'hidden', elevation: 20, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 },
  albumArt: { width: '100%', height: '100%' },
  trackDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  titleArtist: { flex: 1 },
  titleText: { ...typography.headlineMd, fontWeight: '800' },
  artistText: { ...typography.titleLg, marginTop: 4 },
  sliderSection: { marginBottom: 30 },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { ...typography.labelMd, fontWeight: '600' },
  controlsWrapper: { marginBottom: 40 },
  controlsPanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 20, borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  playButton: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', elevation: 10, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
  playGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 40, transform: [{ scale: 1.2 }] },
  playGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  lyricsCard: { borderRadius: 32, overflow: 'hidden', marginBottom: 40 },
  lyricsBlur: { padding: 24, minHeight: 180 },
  lyricsLabel: { ...typography.labelLg, fontWeight: '800', marginBottom: 16, letterSpacing: 2 },
  lyricsSnippet: { flex: 1, justifyContent: 'center' },
  lyricsTextSnippet: { ...typography.headlineSm, fontWeight: '700', lineHeight: 32 },
  fullscreenBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
  fullscreenText: { ...typography.labelSm, fontWeight: '700' },
  modalOverlay: { flex: 1, paddingTop: 60, paddingHorizontal: 24 },
  closeLyrics: { alignSelf: 'flex-end', padding: 10 },
  fullscreenLyricsList: { paddingBottom: 200 },
  lyricLineBtn: { marginVertical: 12 },
  fullscreenLyricText: { ...typography.headlineMd, fontWeight: '800', lineHeight: 48 },
  activeLyricText: { transform: [{ scale: 1.05 }] },
  lyricShareRow: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  shareLyricBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  shareLyricTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
