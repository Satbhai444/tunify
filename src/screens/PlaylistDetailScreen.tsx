import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Share,
  Platform,
  ToastAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu } from '../components/BottomSheet';
import { usePlayerStore, useLibraryStore } from '../stores';
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F39CC', '#0D0D1F']} style={StyleSheet.absoluteFill} />
      
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.artworkContainer}>
               <Image 
                 source={{ uri: artwork || (tracks[0]?.artwork) }} 
                 style={styles.mainArt} 
                 contentFit="cover"
               />
               <BlurView intensity={20} tint="dark" style={styles.artOverlay} />
            </View>

            <View style={styles.infoSection}>
               <Text style={styles.title} numberOfLines={2}>{title || 'Playlist'}</Text>
               <Text style={styles.subtitle}>{tracks.length} songs • {description || 'Curated for you'}</Text>
            </View>

            <View style={styles.controls}>
               <TouchableOpacity 
                 style={styles.playBtn}
                 onPress={() => tracks.length > 0 && play(tracks[0], tracks)}
               >
                  <MaterialIcon name="play-arrow" size={32} color="#FFF" />
               </TouchableOpacity>
               <TouchableOpacity style={styles.actionBtn} onPress={() => showToast('Shuffle coming soon!')}>
                  <MaterialIcon name="shuffle" size={24} color="#FFF" />
               </TouchableOpacity>
               <TouchableOpacity style={styles.actionBtn} onPress={() => Share.share({ message: `Check out ${title} on Tunify!` })}>
                  <MaterialIcon name="share" size={24} color="#FFF" />
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
              <BlurView intensity={10} tint="light" style={styles.trackBlur}>
                <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, isActive && { color: colors.primary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                {isActive && <MaterialIcon name="equalizer" size={18} color={colors.primary} />}
                <TouchableOpacity onPress={() => toggleLike(item)}>
                  <MaterialIcon 
                    name={isLiked(item.id) ? 'favorite' : 'favorite-border'} 
                    size={20} 
                    color={isLiked(item.id) ? '#F44336' : '#5C5C8A'} 
                  />
                </TouchableOpacity>
              </BlurView>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <MaterialIcon name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  scrollContent: {
    paddingBottom: 150,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    width: 200,
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  mainArt: {
    width: '100%',
    height: '100%',
  },
  artOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  infoSection: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 40,
  },
  title: {
    ...typography.headlineSm,
    color: '#FFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySm,
    color: '#A5A5C7',
    marginTop: 6,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginTop: 30,
  },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  trackBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    ...typography.titleSm,
    color: '#FFF',
    fontWeight: '700',
  },
  trackArtist: {
    ...typography.labelSm,
    color: '#5C5C8A',
    marginTop: 2,
  },
});
