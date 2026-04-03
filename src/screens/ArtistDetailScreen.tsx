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
import { getArtistDetails } from '../api/musicService';
import { Track, Artist } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ArtistDetailScreen({ route, navigation }: any) {
  const { artistId, artistName, artistImage } = route.params;
  const [artist, setArtist] = React.useState<Artist | null>(null);
  const [topSongs, setTopSongs] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(true);
  const play = usePlayerStore((s) => s.play);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getArtistDetails(artistId);
        if (data) {
          setArtist(data.artist);
          setTopSongs(data.topSongs);
        }
      } catch (e) {
        console.warn('Artist fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [artistId]);

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
    <View style={styles.container}>
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
                  blurRadius={40}
                  contentFit="cover"
                />
              ) : null}
              <LinearGradient
                colors={['transparent', 'rgba(14,14,14,0.8)', colors.background]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
              >
                <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
              </TouchableOpacity>

              {/* Artist Image */}
              <View style={styles.artistImageContainer}>
                {displayImage ? (
                  <Image
                    source={{ uri: displayImage }}
                    style={styles.artistImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.artistImage, styles.artistPlaceholder]}>
                    <MaterialIcon name="person" size={60} color={colors.onSurfaceVariant} />
                  </View>
                )}
              </View>

              <Text style={styles.artistName}>{displayName}</Text>
              {artist?.followerCount ? (
                <Text style={styles.followerCount}>
                  {artist.followerCount.toLocaleString()} followers
                </Text>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.shuffleBtn} onPress={handlePlayAll}>
                <MaterialIcon name="play-arrow" size={24} color={colors.onPrimaryContainer} />
                <Text style={styles.shuffleBtnText}>Play All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineBtn} onPress={() => {
                const { isShuffled, toggleShuffle } = usePlayerStore.getState();
                if (topSongs.length > 0) {
                  play(topSongs[0], topSongs);
                  if (!isShuffled) toggleShuffle();
                  navigation.navigate('Player');
                }
              }}>
                <MaterialIcon name="shuffle" size={20} color={colors.primary} />
                <Text style={styles.outlineBtnText}>Shuffle</Text>
              </TouchableOpacity>
            </View>

            {/* Section Title */}
            {topSongs.length > 0 && (
              <Text style={styles.sectionTitle}>Popular Songs</Text>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading artist...</Text>
              </View>
            )}

            {!loading && topSongs.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialIcon name="music-off" size={48} color={colors.outline} />
                <Text style={styles.emptyText}>No songs found for this artist</Text>
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
            <Image
              source={{ uri: item.artwork }}
              style={styles.trackArt}
              contentFit="cover"
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: 340,
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
  artistImageContainer: {
    marginBottom: 16,
  },
  artistImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  artistPlaceholder: {
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '800',
    textAlign: 'center',
  },
  followerCount: {
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
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  shuffleBtnText: {
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
  sectionTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '800',
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
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
    paddingVertical: 10,
    gap: 12,
  },
  trackIndex: {
    width: 24,
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 6,
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
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  trackDuration: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
