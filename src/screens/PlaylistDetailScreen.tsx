import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  ToastAndroid,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, darkColors, lightColors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { usePlayerStore, useLibraryStore, useSettingsStore } from '../stores';
import { sharePlaylist } from '../utils/shareUtils';
import { haptics } from '../utils/platform';
import type { Track } from '../types';
import { getPlaylistDetails } from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PlaylistDetailScreen({ route, navigation }: any) {
  const { playlistId, title, artwork, description } = route.params || {};
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const downloads = useLibraryStore((s) => s.downloads);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  function showToast(msg: string) {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  }

  React.useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  async function loadPlaylist() {
    setLoading(true);
    if (playlistId === '__downloads__') {
      setTracks(downloads as Track[]);
    } else if (playlistId?.startsWith('pl_')) {
      const resolved = useLibraryStore.getState().getPlaylistTracks(playlistId);
      setTracks(resolved);
    } else {
      try {
        const data = await getPlaylistDetails(playlistId);
        if (data?.tracks) setTracks(data.tracks);
      } catch {}
    }
    setLoading(false);
  }

  const handleRename = () => {
    if (!playlistId?.startsWith('pl_')) return;
    Alert.prompt(
      'Rename Playlist',
      'Enter new name for your playlist',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Rename', 
          onPress: async (newName?: string) => {
            if (newName && playlistId) {
              await useLibraryStore.getState().renamePlaylist(playlistId, newName);
              showToast('Playlist renamed');
              navigation.setParams({ title: newName });
            }
          }
        }
      ],
      'plain-text',
      title
    );
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      haptics.impact('medium');
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      play(shuffled[0], shuffled);
      showToast('Shuffling Playlist');
      navigation.navigate('Player');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={themeMode === 'dark' ? ['#4F39CC', '#0D0D1F'] : ['#A5B4FC', '#F8F9FE']} style={StyleSheet.absoluteFill} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={[styles.artworkContainer, { shadowColor: theme.primary }]}>
                 <Image 
                   source={{ uri: artwork || (tracks[0]?.artwork) }} 
                   style={styles.mainArt} 
                   contentFit="cover"
                 />
                 <BlurView intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.artOverlay} />
              </View>

              <View style={styles.infoSection}>
                 <TouchableOpacity onPress={handleRename} disabled={!playlistId?.startsWith('pl_')}>
                    <Text style={[styles.title, { color: theme.onSurface }]} numberOfLines={2}>{title || 'Playlist'}</Text>
                 </TouchableOpacity>
                 <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>{tracks.length} songs • {description || 'Curated for you'}</Text>
              </View>

              <View style={styles.controls}>
                 <TouchableOpacity 
                   style={[styles.playBtn, { backgroundColor: theme.primary }]}
                   onPress={() => tracks.length > 0 && play(tracks[0], tracks)}
                 >
                    <MaterialIcon name="play-arrow" size={32} color="#FFF" />
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.actionBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
                   onPress={handleShuffle}
                 >
                    <MaterialIcon name="shuffle" size={24} color={theme.onSurface} />
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.actionBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
                   onPress={() => sharePlaylist(title || 'Playlist', tracks.length, playlistId)}
                 >
                    <MaterialIcon name="share" size={24} color={theme.onSurface} />
                 </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = currentTrack?.id === item.id;
            return (
              <TouchableOpacity 
                style={styles.trackRow}
                onPress={() => play(item, tracks)}
              >
                <BlurView intensity={10} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.trackBlur, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                  <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.trackArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
                  </View>
                  {isActive && <MaterialIcon name="equalizer" size={18} color={theme.primary} />}
                  <TouchableOpacity onPress={() => toggleLike(item)}>
                    <MaterialIcon 
                      name={isLiked(item.id) ? 'favorite' : 'favorite-border'} 
                      size={20} 
                      color={isLiked(item.id) ? theme.error : theme.onSurfaceVariant} 
                    />
                  </TouchableOpacity>
                </BlurView>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
        onPress={() => navigation.goBack()}
      >
        <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 150 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 30 },
  backButton: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  artworkContainer: { width: 220, height: 220, borderRadius: 32, overflow: 'hidden', elevation: 20, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  mainArt: { width: '100%', height: '100%' },
  artOverlay: { ...StyleSheet.absoluteFillObject },
  infoSection: { alignItems: 'center', marginTop: 24, paddingHorizontal: 40 },
  title: { ...typography.headlineSm, fontWeight: '800', textAlign: 'center' },
  subtitle: { ...typography.bodySm, marginTop: 6, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 30, marginTop: 30 },
  playBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  trackRow: { marginHorizontal: 20, marginBottom: 10, borderRadius: 20, overflow: 'hidden' },
  trackBlur: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
  trackArt: { width: 48, height: 48, borderRadius: 12 },
  trackInfo: { flex: 1 },
  trackTitle: { ...typography.titleSm, fontWeight: '700' },
  trackArtist: { ...typography.labelSm, marginTop: 2 },
});
