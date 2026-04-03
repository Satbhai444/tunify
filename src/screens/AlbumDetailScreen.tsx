import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { usePlayerStore } from '../stores';
import { getAlbumDetails } from '../api/musicService';
import { Track, Album } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AlbumDetailScreen({ route, navigation }: any) {
  const { albumId, albumName, albumArtwork } = route.params;
  const [album, setAlbum] = React.useState<Album | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  const play = usePlayerStore((s) => s.play);

  React.useEffect(() => {
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
    <View style={styles.container}>
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
                  blurRadius={50}
                  contentFit="cover"
                />
              ) : null}
              <LinearGradient
                colors={['transparent', 'rgba(14,14,14,0.85)', colors.background]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
              >
                <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
              </TouchableOpacity>

              {/* Album Art */}
              <View style={styles.albumArtContainer}>
                {displayArtwork ? (
                  <Image
                    source={{ uri: displayArtwork }}
                    style={styles.albumArt}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.albumArt, styles.albumPlaceholder]}>
                    <MaterialIcon name="album" size={60} color={colors.onSurfaceVariant} />
                  </View>
                )}
              </View>

              <Text style={styles.albumTitle} numberOfLines={2}>{displayTitle}</Text>
              {displayArtist ? (
                <Text style={styles.albumArtist}>{displayArtist}</Text>
              ) : null}
              <Text style={styles.albumMeta}>
                {album?.year ? `${album.year} • ` : ''}{tracks.length} songs{totalMin > 0 ? ` • ${totalMin} min` : ''}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.playBtn} onPress={handlePlayAll}>
                <MaterialIcon name="play-arrow" size={24} color={colors.onPrimaryContainer} />
                <Text style={styles.playBtnText}>Play All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => {
                if (tracks.length > 0) {
                  const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                  play(shuffled[0], shuffled);
                  navigation.navigate('Player');
                }
              }}>
                <MaterialIcon name="shuffle" size={20} color={colors.primary} />
                <Text style={styles.outlineBtnText}>Shuffle</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading album...</Text>
              </View>
            )}

            {!loading && tracks.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialIcon name="music-off" size={48} color={colors.outline} />
                <Text style={styles.emptyText}>No tracks found in this album</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.trackRow}
            onPress={() => handleTrackPress(item)}
            activeOpacity={0.6}
          >
            <Text style={styles.trackIndex}>{index + 1}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.trackArtistSmall} numberOfLines={1}>{item.artist}</Text>
            </View>
            <Text style={styles.trackDuration}>
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListFooterComponent={<MadeInIndiaFooter />}
      />
    </View>
  );
}

const ART_SIZE = SCREEN_WIDTH * 0.55;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: 380,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  albumArtContainer: {
    marginBottom: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  albumArt: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: radii.lg,
  },
  albumPlaceholder: {
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  albumArtist: {
    ...typography.titleSm,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  albumMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: 20,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  playBtnText: {
    ...typography.titleSm,
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  outlineBtnText: {
    ...typography.titleSm,
    color: colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 14,
  },
  trackIndex: {
    width: 24,
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  trackArtistSmall: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  trackDuration: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
