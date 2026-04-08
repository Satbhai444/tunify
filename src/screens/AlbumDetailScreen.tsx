import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { usePlayerStore, useSettingsStore } from '../stores';
import { getAlbumDetails } from '../api/musicService';
import { Track, Album } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AlbumDetailScreen({ route, navigation }: any) {
  const { albumId, albumName, albumArtwork } = route.params;
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    (async () => {
      try {
        const data = await getAlbumDetails(albumId);
        if (data) {
          setAlbum(data.album);
          setTracks(data.tracks);
        }
      } catch (e) {
        console.warn('Album fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [albumId]);

  const displayTitle = album?.title || albumName || 'Album';
  const displayArtwork = album?.artwork || albumArtwork || '';
  const displayArtist = album?.artist || '';

  function handlePlayAll() {
    if (tracks.length > 0) {
      play(tracks[0], tracks);
      navigation.navigate('Player');
    }
  }

  function handleTrackPress(track: Track) {
    play(track, tracks);
    navigation.navigate('Player');
  }

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
  const totalMin = Math.floor(totalDuration / 60);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.hero}>
              {displayArtwork ? (
                <Image
                  source={{ uri: displayArtwork }}
                  style={StyleSheet.absoluteFillObject}
                  blurRadius={themeMode === 'dark' ? 50 : 30}
                  contentFit="cover"
                />
              ) : null}
              <LinearGradient
                colors={['transparent', themeMode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.5)', theme.background]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Back Button */}
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }]}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
              >
                <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
              </TouchableOpacity>

              {/* Album Art */}
              <View style={[styles.albumArtContainer, { shadowColor: themeMode === 'dark' ? '#000' : theme.primary }]}>
                {displayArtwork ? (
                  <Image
                    source={{ uri: displayArtwork }}
                    style={styles.albumArt}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.albumArt, { backgroundColor: theme.surfaceContainerHighest }]}>
                    <MaterialIcon name="album" size={60} color={theme.onSurfaceVariant} />
                  </View>
                )}
              </View>

              <Text style={[styles.albumTitle, { color: theme.onSurface }]} numberOfLines={2}>{displayTitle}</Text>
              {displayArtist ? (
                <Text style={[styles.albumArtist, { color: theme.primary }]}>{displayArtist}</Text>
              ) : null}
              <Text style={[styles.albumMeta, { color: theme.onSurfaceVariant }]}>
                {album?.year ? `${album.year} • ` : ''}{tracks.length} songs{totalMin > 0 ? ` • ${totalMin} min` : ''}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.playBtn, { backgroundColor: theme.primary }]} onPress={handlePlayAll}>
                <MaterialIcon name="play-arrow" size={24} color="#FFF" />
                <Text style={styles.playBtnText}>Play All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.outlineBtn, { borderColor: theme.primary }]} 
                onPress={() => {
                  if (tracks.length > 0) {
                    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                    play(shuffled[0], shuffled);
                    navigation.navigate('Player');
                  }
                }}
              >
                <MaterialIcon name="shuffle" size={20} color={theme.primary} />
                <Text style={[styles.outlineBtnText, { color: theme.primary }]}>Shuffle</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.statusText, { color: theme.onSurfaceVariant }]}>Loading tracks...</Text>
              </View>
            )}

            {!loading && tracks.length === 0 && (
              <View style={styles.center}>
                <MaterialIcon name="music-off" size={48} color={theme.onSurfaceVariant} />
                <Text style={[styles.statusText, { color: theme.onSurfaceVariant }]}>Album is empty</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const isActive = currentTrack?.id === item.id;
          return (
            <TouchableOpacity
              style={styles.trackRow}
              onPress={() => handleTrackPress(item)}
              activeOpacity={0.6}
            >
              <Text style={[styles.trackIndex, { color: theme.onSurfaceVariant }, isActive && { color: theme.primary }]}>{index + 1}</Text>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.trackArtistSmall, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
              </View>
              {isActive ? (
                <MaterialIcon name="equalizer" size={18} color={theme.primary} />
              ) : (
                <Text style={[styles.trackDuration, { color: theme.onSurfaceVariant }]}>
                  {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListFooterComponent={<MadeInIndiaFooter />}
      />
    </View>
  );
}

const ART_SIZE = SCREEN_WIDTH * 0.58;

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 420, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  albumArtContainer: { marginBottom: 20, elevation: 20, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20 },
  albumArt: { width: ART_SIZE, height: ART_SIZE, borderRadius: radii.xl },
  albumTitle: { ...typography.headlineMd, fontWeight: '900', textAlign: 'center', paddingHorizontal: spacing.xl, letterSpacing: -0.5 },
  albumArtist: { ...typography.titleSm, marginTop: 6, fontWeight: '800' },
  albumMeta: { ...typography.labelLg, marginTop: 4, opacity: 0.8 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: spacing.xl, paddingVertical: 24 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 32, elevation: 8 },
  playBtnText: { ...typography.titleSm, color: '#FFF', fontWeight: '800' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 32 },
  outlineBtnText: { ...typography.titleSm, fontWeight: '800' },
  center: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  statusText: { ...typography.bodyMd, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 14, gap: 14 },
  trackIndex: { width: 24, ...typography.bodySm, fontWeight: '700', textAlign: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { ...typography.titleSm, fontWeight: '700' },
  trackArtistSmall: { ...typography.labelSm, marginTop: 4, fontWeight: '500' },
  trackDuration: { ...typography.labelSm, fontWeight: '600', opacity: 0.7 },
});
