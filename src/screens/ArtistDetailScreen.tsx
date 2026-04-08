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
import { getArtistDetails, searchSongs } from '../api/musicService';
import { Track, Artist } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ArtistDetailScreen({ route, navigation }: any) {
  const { artistId, artistName, artistImage } = route.params;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [topSongs, setTopSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    (async () => {
      try {
        let artistData = null;
        let songs: Track[] = [];

        // 1. Attempt standard Artist API fetch using artistId first
        if (artistId) {
          const res = await getArtistDetails(artistId);
          if (res) {
            artistData = res.artist;
            songs = res.topSongs;
          }
        }

        // 2. If no songs were found (or no artistId provided), fallback to searching by name
        if (songs.length === 0 && (artistName || artistData?.name)) {
          const fallbackSongs = await searchSongs(artistName || artistData?.name || '');
          // Make sure we only get songs from this artist
          songs = fallbackSongs.filter((t: Track) => t.artist.toLowerCase().includes((artistName || artistData?.name || '').toLowerCase()));
          
          if (songs.length === 0) {
            // Very relaxed filter if exact match failed
            songs = fallbackSongs; 
          }
        }

        if (artistData) setArtist(artistData);
        setTopSongs(songs);
      } catch (e) {
        console.warn('Artist fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [artistId, artistName]);

  const displayName = artist?.name || artistName || 'Artist';
  const displayImage = artist?.image || artistImage || '';

  function handlePlayAll() {
    if (topSongs.length > 0) {
      play(topSongs[0], topSongs);
      navigation.navigate('Player');
    }
  }

  function handleTrackPress(track: Track) {
    play(track, topSongs);
    navigation.navigate('Player');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      <FlatList
        data={topSongs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.hero}>
              {displayImage ? (
                <Image
                  source={{ uri: displayImage }}
                  style={StyleSheet.absoluteFillObject}
                  blurRadius={themeMode === 'dark' ? 40 : 20}
                  contentFit="cover"
                />
              ) : null}
              <LinearGradient
                colors={['transparent', themeMode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', theme.background]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Back Button */}
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }]}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
              >
                <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
              </TouchableOpacity>

              {/* Artist Image */}
              <View style={styles.artistImageContainer}>
                {displayImage ? (
                  <Image
                    source={{ uri: displayImage }}
                    style={[styles.artistImage, { borderColor: theme.primary }]}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.artistImage, { backgroundColor: theme.surfaceContainerHighest, borderColor: theme.primary }]}>
                    <MaterialIcon name="person" size={60} color={theme.onSurfaceVariant} />
                  </View>
                )}
              </View>

              <Text style={[styles.artistName, { color: theme.onSurface }]}>{displayName}</Text>
              {artist?.followerCount ? (
                <View style={[styles.followerPill, { backgroundColor: theme.primary + '15' }]}>
                   <Text style={[styles.followerCount, { color: theme.primary }]}>
                     {artist.followerCount.toLocaleString()} followers
                   </Text>
                </View>
              ) : null}
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
                  if (topSongs.length > 0) {
                    const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
                    play(shuffled[0], shuffled);
                    navigation.navigate('Player');
                  }
                }}
              >
                <MaterialIcon name="shuffle" size={20} color={theme.primary} />
                <Text style={[styles.outlineBtnText, { color: theme.primary }]}>Shuffle</Text>
              </TouchableOpacity>
            </View>

            {/* Section Title */}
            {topSongs.length > 0 && (
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Popular Songs</Text>
            )}

            {loading && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.statusText, { color: theme.onSurfaceVariant }]}>Loading artist...</Text>
              </View>
            )}

            {!loading && topSongs.length === 0 && (
              <View style={styles.center}>
                <MaterialIcon name="music-off" size={48} color={theme.onSurfaceVariant} />
                <Text style={[styles.statusText, { color: theme.onSurfaceVariant }]}>No songs found</Text>
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
              <Image
                source={{ uri: item.artwork }}
                style={styles.trackArt}
                contentFit="cover"
              />
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.trackArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>Popular</Text>
              </View>
              <MaterialIcon name={isActive ? "equalizer" : "more-vert"} size={20} color={theme.onSurfaceVariant} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 150 }}
        ListFooterComponent={<MadeInIndiaFooter />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 380, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  artistImageContainer: { marginBottom: 16, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  artistImage: { width: 170, height: 170, borderRadius: 85, borderWidth: 4 },
  artistName: { ...typography.headlineLg, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  followerPill: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  followerCount: { ...typography.labelLg, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: spacing.xl, paddingVertical: 24 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 32, elevation: 8 },
  playBtnText: { ...typography.titleSm, color: '#FFF', fontWeight: '800' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 32 },
  outlineBtnText: { ...typography.titleSm, fontWeight: '800' },
  sectionTitle: { ...typography.headlineSm, fontWeight: '900', paddingHorizontal: spacing.xl, marginBottom: 16 },
  center: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  statusText: { ...typography.bodyMd, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 12, gap: 14 },
  trackIndex: { width: 20, ...typography.bodySm, fontWeight: '600', textAlign: 'center' },
  trackArt: { width: 54, height: 54, borderRadius: radii.md },
  trackInfo: { flex: 1 },
  trackTitle: { ...typography.titleSm, fontWeight: '700' },
  trackArtist: { ...typography.labelSm, marginTop: 4 },
});
