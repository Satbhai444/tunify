import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Share,
  ToastAndroid,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu } from '../components/BottomSheet';
import { useLibraryStore, usePlayerStore } from '../stores';
import type { Track } from '../types';

export function LikedSongsScreen({ navigation }: any) {
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const [trackMenu, setTrackMenu] = React.useState<Track | null>(null);

  function showToast(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }

  function handlePlay(track: Track) {
    play(track, likedSongs);
  }

  function handlePlayAll() {
    if (likedSongs.length > 0) {
      play(likedSongs[0], likedSongs);
    }
  }

  function handleShufflePlay() {
    if (likedSongs.length > 0) {
      const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
      play(shuffled[0], shuffled);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={likedSongs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
        ListFooterComponent={<MadeInIndiaFooter />}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <LinearGradient colors={['#450af5', '#8e8ee5', colors.background]} style={styles.hero}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>
                <MaterialIcon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <MaterialIcon name="favorite" size={64} color="#fff" />
              <Text style={styles.heroTitle}>Liked Songs</Text>
              <Text style={styles.heroCount}>{likedSongs.length} songs</Text>
            </LinearGradient>

            {/* Action Row */}
            {likedSongs.length > 0 && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.shuffleBtn} onPress={handleShufflePlay}>
                  <MaterialIcon name="shuffle" size={22} color={colors.onSurface} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
                  <MaterialIcon name="play-arrow" size={30} color={colors.onPrimaryContainer} />
                </TouchableOpacity>
              </View>
            )}

            {likedSongs.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <MaterialIcon name="favorite-border" size={64} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No liked songs yet</Text>
                <Text style={styles.emptyText}>Tap the heart icon on any song to save it here for easy access</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>
                  <MaterialIcon name="search" size={20} color={colors.onPrimary} />
                  <Text style={styles.emptyBtnText}>Explore Songs</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const isActive = currentTrack?.id === item.id;
          return (
            <TouchableOpacity
              style={styles.trackRow}
              onPress={() => handlePlay(item)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.artwork }} style={styles.trackArt} contentFit="cover" />
              <View style={styles.trackInfo}>
                <Text
                  style={[styles.trackTitle, isActive && { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              {isActive && <MaterialIcon name="equalizer" size={20} color={colors.primary} />}
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setTrackMenu(item)}
              >
                <MaterialIcon name="more-vert" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {/* Track Menu */}
      {trackMenu && (
        <BottomSheetMenu
          visible={!!trackMenu}
          onClose={() => setTrackMenu(null)}
          title={trackMenu.title}
          subtitle={trackMenu.artist}
          artwork={trackMenu.artwork}
          options={[
            {
              icon: 'heart-broken',
              label: 'Remove from Liked Songs',
              destructive: true,
              onPress: () => {
                toggleLike(trackMenu);
                showToast('Removed from Liked Songs');
              },
            },
            {
              icon: 'queue-music',
              label: 'Add to Queue',
              onPress: () => {
                addToQueue(trackMenu);
                showToast('Added to queue');
              },
            },
            {
              icon: 'share',
              label: 'Share',
              onPress: () => {
                Share.share({
                  message: `🎵 Listen to "${trackMenu.title}" by ${trackMenu.artist} on Tunify!`,
                });
              },
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    paddingTop: 80,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: spacing.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.headlineLg,
    color: '#fff',
    fontWeight: '800',
  },
  heroCount: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.7)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 16,
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAllBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  emptyBtnText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    gap: 12,
  },
  trackArt: {
    width: 50,
    height: 50,
    borderRadius: radii.sm,
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
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});
