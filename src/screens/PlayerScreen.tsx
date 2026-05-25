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
  FlatList,
  ActivityIndicator,
  Animated,
  Easing,
  TextInput,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { haptics } from '../utils/platform';
import { downloadService } from '../services/downloadService';
import { shareSong, shareLyric } from '../utils/shareUtils';
import { darkColors, lightColors, typography, spacing, radii } from '../theme';
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
const ART_SIZE = SCREEN_WIDTH * 0.65;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const LYRIC_OFFSET = 0.3;

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
    sleepTimerRemaining,
    setQueue,
  } = usePlayerStore();

  const { themeMode } = useSettingsStore();
  // Player always uses immersive dark tones
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
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const liked = currentTrack ? likedSongs.some(t => t.id === currentTrack.id) : false;

  const scrollRef = useRef<ScrollView>(null);
  const fullscreenScrollRef = useRef<ScrollView>(null);

  const artScale = useRef(new Animated.Value(1)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const lastUserScroll = useRef<number>(0);
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  };

  // Glow pulsation for circular art
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.8, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.timing(glowAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1 : 0.85,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [isPlaying]);

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

    getArtistInfo(currentTrack.artist).then(setArtistInfo);
    getArtistTopTracks(currentTrack.artist).then(setArtistTracks);
  }, [currentTrack]);

  useEffect(() => {
    if (!lyrics.length || !isPlaying) return;
    if (Date.now() - lastUserScroll.current < 5000) return;

    const activeIdx = lyrics.findIndex((l, i) => {
      const next = lyrics[i + 1];
      return (position + LYRIC_OFFSET) >= l.time && (!next || (position + LYRIC_OFFSET) < next.time);
    });

    if (activeIdx !== -1) {
      fullscreenScrollRef.current?.scrollTo({ y: activeIdx * 64, animated: true });
    }
  }, [position, lyrics, isPlaying]);

  const handlePlayPause = async () => {
    haptics.impact('medium');
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
      const result = await downloadService.downloadTrack(currentTrack);
      if (result) {
        showToast('Download complete!');
      } else {
        showToast('Download failed. Try again.');
      }
    } catch (e) {
      showToast('Download failed. Try again.');
    }
  };

  const currentLyricIdx = lyrics.findIndex((l, i) => {
    const next = lyrics[i + 1];
    return (position + LYRIC_OFFSET) >= l.time && (!next || (position + LYRIC_OFFSET) < next.time);
  });

  if (!currentTrack) {
    return <View style={[styles.container, { backgroundColor: '#0E0E0E' }]} />;
  }

  // Player always uses dark immersive background
  const playerBg = '#0E0E0E';
  const playerText = '#F5F0EA';
  const playerMuted = '#9E9385';
  const playerAccent = themeMode === 'dark' ? '#D4AA70' : '#C8A97E';

  return (
    <View style={[styles.container, { backgroundColor: playerBg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#2A1F14', '#1A1610', playerBg]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <MaterialIcon name="keyboard-arrow-down" size={32} color={playerText} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerLabel, { color: playerMuted }]}>PLAYING FROM</Text>
          <Text style={[styles.headerTitle, { color: playerText }]} numberOfLines={1}>
            {currentTrack?.album || 'tunify'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerIcon} 
          onPress={() => currentTrack && shareSong(currentTrack)}
        >
          <MaterialIcon name="share" size={24} color={playerText} />
        </TouchableOpacity>
      </View>
      <ScrollView 
        ref={scrollRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        decelerationRate="normal"
      >
        <View style={styles.mainPlayerPage}>
          {/* Circular Album Art with Glow */}
          <View style={styles.artworkWrapper}>
            {/* Glow layers */}
            <Animated.View style={[styles.glowRing, styles.glowOuter, { opacity: glowAnim, backgroundColor: playerAccent }]} />
            <Animated.View style={[styles.glowRing, styles.glowMiddle, { opacity: Animated.multiply(glowAnim, 0.6), backgroundColor: playerAccent }]} />
            
            <Animated.View style={[styles.artContainer, { transform: [{ scale: artScale }] }]}>
              <Image
                source={{ uri: currentTrack.artwork }}
                style={styles.albumArt}
                contentFit="cover"
                transition={300}
              />
            </Animated.View>
          </View>

          {/* Track Details — Centered */}
          <View style={styles.trackDetails}>
            <View style={styles.titleArtist}>
              <Text style={[styles.titleText, { color: playerText }]} numberOfLines={1}>{String(currentTrack.title)}</Text>
            </View>
            <TouchableOpacity onPress={handleLike}>
              <MaterialIcon 
                name={liked ? 'favorite' : 'favorite-border'} 
                size={28} 
                color={liked ? '#FF6B6B' : playerMuted} 
              />
            </TouchableOpacity>
          </View>

          {/* Inline Lyrics Preview */}
          {lyrics.length > 0 && (
            <TouchableOpacity style={styles.inlineLyrics} onPress={() => setLyricsModalVisible(true)} activeOpacity={0.7}>
              {[-1, 0, 1].map((offset) => {
                const idx = currentLyricIdx + offset;
                if (idx < 0 || idx >= lyrics.length) return null;
                const isActive = offset === 0;
                return (
                  <Text
                    key={idx}
                    style={[
                      styles.inlineLyricLine,
                      {
                        color: isActive ? playerAccent : playerMuted,
                        fontSize: isActive ? 18 : 14,
                        fontWeight: isActive ? '800' : '400',
                        opacity: isActive ? 1 : 0.4,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {String(lyrics[idx]?.text || '')}
                  </Text>
                );
              })}
              {lyricsLoading && <ActivityIndicator color={playerAccent} size="small" />}
            </TouchableOpacity>
          )}

          {/* Progress Bar */}
          <View style={styles.sliderSection}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration || 1}
              value={position}
              onSlidingComplete={seekTo}
              minimumTrackTintColor={playerAccent}
              maximumTrackTintColor="rgba(245,240,234,0.15)"
              thumbTintColor={playerAccent}
            />
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: playerMuted }]}>{formatTime(position)}</Text>
              <Text style={[styles.timeText, { color: playerMuted }]}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={toggleShuffle}>
              <MaterialIcon name="shuffle" size={24} color={isShuffled ? playerAccent : playerMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={skipPrevious}>
              <MaterialIcon name="skip-previous" size={38} color={playerText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: playerAccent }]}
              onPress={handlePlayPause}
              activeOpacity={0.9}
            >
              {isBuffering ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <MaterialIcon name={isPlaying ? 'pause' : 'play-arrow'} size={40} color="#FFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={skipNext}>
              <MaterialIcon name="skip-next" size={38} color={playerText} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleRepeat}>
              <MaterialIcon 
                name={repeatMode === 'one' ? 'repeat-one' : 'repeat'} 
                size={24} 
                color={repeatMode !== 'off' ? playerAccent : playerMuted} 
              />
            </TouchableOpacity>
          </View>

          {/* Extra Controls Row */}
          <View style={styles.extraControls}>
            <TouchableOpacity onPress={() => usePlayerStore.getState().setSleepTimer(sleepTimerRemaining ? null : 30)} style={styles.extraBtn}>
              <MaterialIcon name="nights-stay" size={20} color={sleepTimerRemaining ? playerAccent : playerMuted} />
              {sleepTimerRemaining && <Text style={[styles.extraBtnText, { color: playerAccent }]}>{formatTime(sleepTimerRemaining)}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQueueVisible(true)} style={styles.extraBtn}>
              <MaterialIcon name="queue-music" size={20} color={playerMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.extraBtn}>
              <MaterialIcon name="more-horiz" size={20} color={playerMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Artist Card */}
        {!!artistInfo && (
          <TouchableOpacity 
            style={[styles.artistCard, { backgroundColor: 'rgba(245,240,234,0.05)', borderColor: 'rgba(245,240,234,0.08)' }]} 
            onPress={() => navigation.navigate('ArtistDetail', { artistId: currentTrack.artistId, artistName: artistInfo.name, artistImage: artistInfo.image || currentTrack.artwork })}
            activeOpacity={0.9}
          >
            <View style={styles.artistCardContent}>
              <Text style={[styles.artistCardLabel, { color: playerMuted }]}>ABOUT THE ARTIST</Text>
              <View style={styles.artistCardProfile}>
                <Image source={{ uri: artistInfo.image || currentTrack.artwork }} style={styles.artistCardAvatar} />
                <View style={styles.artistCardTitleBox}>
                  <Text style={[styles.artistCardName, { color: playerText }]} numberOfLines={1}>{String(artistInfo.name)}</Text>
                  {artistInfo.listeners && (
                    <Text style={[styles.artistCardListeners, { color: playerAccent }]}>
                      {parseInt(artistInfo.listeners).toLocaleString()} monthly listeners
                    </Text>
                  )}
                </View>
              </View>
              {artistInfo.bio && (
                <Text style={[styles.artistCardBio, { color: playerMuted }]} numberOfLines={3}>
                  {String(artistInfo.bio.replace(/<a href=(.*?)>(.*?)<\/a>/g, '').replace(/<a.*?>(.*?)<\/a>/g, ''))}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Credits */}
        <View style={[styles.creditsCard, { backgroundColor: 'rgba(245,240,234,0.03)', borderColor: 'rgba(245,240,234,0.06)' }]}>
           <Text style={[styles.creditsHeader, { color: playerText }]}>Credits</Text>
           <View style={styles.creditRow}>
              <View>
                 <Text style={[styles.creditRole, { color: playerMuted }]}>Main Artist</Text>
                 <Text style={[styles.creditName, { color: playerText }]}>{String(currentTrack.artist)}</Text>
              </View>
           </View>
           {currentTrack.album && (
           <View style={styles.creditRow}>
              <View>
                 <Text style={[styles.creditRole, { color: playerMuted }]}>Album / Project</Text>
                 <Text style={[styles.creditName, { color: playerText }]}>{String(currentTrack.album)}</Text>
              </View>
           </View>
           )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title={currentTrack.title}
        subtitle={currentTrack.artist}
        artwork={currentTrack.artwork}
        options={[
          { icon: liked ? 'favorite' : 'favorite-border', label: liked ? 'Unlike' : 'Like', color: liked ? '#FF6B6B' : playerAccent, onPress: handleLike },
          { icon: 'playlist-add', label: 'Add to Playlist', onPress: () => setPlaylistPickerVisible(true) },
          { icon: 'share', label: 'Share Song', onPress: () => shareSong(currentTrack) },
          { icon: 'file-download', label: 'Download', onPress: handleDownload },
          { icon: 'queue-music', label: 'Add to Queue', onPress: () => { addToQueue(currentTrack); showToast('Added to queue'); } },
        ]}
      />

      <Modal visible={lyricsModalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(14,14,14,0.97)' }]}>
          <TouchableOpacity style={styles.closeLyrics} onPress={() => setLyricsModalVisible(false)}>
            <MaterialIcon name="close" size={32} color={playerText} />
          </TouchableOpacity>
          <ScrollView 
            ref={fullscreenScrollRef}
            contentContainerStyle={styles.fullscreenLyricsList}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => { lastUserScroll.current = Date.now(); }}
            onMomentumScrollEnd={() => { lastUserScroll.current = Date.now(); }}
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
                  { color: i === currentLyricIdx ? playerAccent : playerMuted },
                  i === currentLyricIdx && styles.activeLyricText
                ]}>
                  {String(l.text)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.lyricShareRow}>
             <TouchableOpacity style={[styles.shareLyricBtn, { backgroundColor: playerAccent }]} onPress={() => shareLyric(currentTrack, lyrics[currentLyricIdx]?.text || '')}>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, height: 120 },
  headerIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  headerTitle: { ...typography.titleSm, fontWeight: '600', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20 },
  artworkWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, height: ART_SIZE + 60 },
  
  /* Glow rings behind circular art */
  glowRing: { position: 'absolute', borderRadius: 9999 },
  glowOuter: { width: ART_SIZE + 60, height: ART_SIZE + 60 },
  glowMiddle: { width: ART_SIZE + 30, height: ART_SIZE + 30 },
  
  artContainer: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: ART_SIZE / 2,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#D4AA70',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  albumArt: { width: '100%', height: '100%' },
  
  trackDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  titleArtist: { flex: 1 },
  titleText: { ...typography.headlineMd, fontWeight: '800' },
  artistText: { ...typography.titleMd, marginTop: 4 },
  artistLinks: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  artistLinkContainer: { flexDirection: 'row', alignItems: 'center' },

  /* Inline Lyrics */
  inlineLyrics: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  inlineLyricLine: { textAlign: 'center', marginVertical: 2 },

  sliderSection: { marginBottom: 20 },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  timeText: { ...typography.labelMd, fontWeight: '600' },
  
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, marginBottom: 20 },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#D4AA70',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },

  extraControls: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 24 },
  extraBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  extraBtnText: { ...typography.labelSm, fontWeight: '700' },

  mainPlayerPage: { minHeight: SCREEN_HEIGHT - 200, justifyContent: 'center', paddingBottom: 20 },
  
  artistCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, padding: 20 },
  artistCardContent: {},
  artistCardLabel: { ...typography.labelSm, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  artistCardProfile: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  artistCardAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  artistCardTitleBox: { flex: 1, justifyContent: 'center' },
  artistCardName: { ...typography.titleLg, fontWeight: '800' },
  artistCardListeners: { ...typography.labelMd, fontWeight: '700', marginTop: 4 },
  artistCardBio: { ...typography.bodyMd, lineHeight: 22 },
  
  creditsCard: { borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1 },
  creditsHeader: { ...typography.titleLg, fontWeight: '800', marginBottom: 20 },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  creditRole: { ...typography.labelMd, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  creditName: { ...typography.titleMd, fontWeight: '700' },

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
