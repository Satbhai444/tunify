import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore, usePlayerStore } from '../stores';
import { LinearGradient } from 'expo-linear-gradient';

export function LibraryScreen({ navigation }: any) {
  const playlists = useLibraryStore((s) => s.playlists);
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const downloads = useLibraryStore((s) => s.downloads);
  const [activeFilter, setActiveFilter] = React.useState<string>('Playlists');
  const [sortBy, setSortBy] = React.useState<'recent' | 'alpha'>('recent');
  const [gridView, setGridView] = React.useState(false);

  const play = usePlayerStore((s) => s.play);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);

  function handleSortToggle() {
    Alert.alert('Sort by', '', [
      { text: 'Recently Played', onPress: () => setSortBy('recent') },
      { text: 'Alphabetical', onPress: () => setSortBy('alpha') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const filters = ['Playlists', 'Artists', 'Albums', 'Downloads'];

  const libraryItems = [
    {
      id: 'blend',
      title: 'Duo Blend',
      subtitle: 'Blend your taste with a friend',
      type: 'blend',
      icon: 'group',
      onPress: () => navigation.navigate('Blend'),
    },
    {
      id: 'liked',
      title: 'Liked Songs',
      subtitle: `Playlist • ${likedSongs.length} songs`,
      type: 'gradient',
      icon: 'favorite',
      onPress: () => navigation.navigate('LikedSongs'),
    },
    {
      id: 'downloads',
      title: 'Offline Essentials',
      subtitle: `Playlist • ${downloads.length} songs`,
      type: 'icon',
      icon: 'download-for-offline',
      onPress: () => {
        if (downloads.length === 0) {
          Alert.alert('No Downloads', 'Downloaded songs will appear here for offline listening.');
        } else {
          navigation.navigate('PlaylistDetail', { playlistId: '__downloads__', title: 'Offline Essentials' });
        }
      },
    },
    ...playlists.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: `Playlist • ${p.trackIds.length} songs`,
      type: 'playlist',
      onPress: () => navigation.navigate('PlaylistDetail', { playlistId: p.id, title: p.title }),
    })),
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.brandName}>Tunify</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <MaterialIcon name="search" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <MaterialIcon name="settings" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.pageTitle}>Your Library</Text>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && styles.activeChip]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.chipText, activeFilter === f && styles.activeChipText]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <TouchableOpacity style={styles.sortButton} onPress={handleSortToggle}>
          <MaterialIcon name="swap-vert" size={18} color={colors.onSurfaceVariant} />
          <Text style={styles.sortText}>{sortBy === 'recent' ? 'RECENTLY PLAYED' : 'A-Z'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGridView(!gridView)}>
          <MaterialIcon name={gridView ? 'view-list' : 'grid-view'} size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: 10 }}>
            <Text style={[typography.titleMd, { color: colors.onSurface, fontWeight: '700' }]}>🕐 Recently Played</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              {recentlyPlayed.length > 5 && (
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                  <Text style={[typography.bodySm, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              )}
              {recentlyPlayed.length > 5 && (
                <TouchableOpacity onPress={() => {
                  Alert.alert('Clear History', 'Remove all recently played songs?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => useLibraryStore.getState().clearRecentlyPlayed() },
                  ]);
                }}>
                  <Text style={[typography.bodySm, { color: colors.error }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <FlatList
            data={recentlyPlayed.slice(0, 15)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `rp_${item.id}`}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ width: 100, alignItems: 'center' }}
                onPress={() => {
                  play(item, recentlyPlayed);
                  navigation.navigate('Player');
                }}
                activeOpacity={0.7}
              >
                <View style={{ width: 100, height: 100, borderRadius: radii.md, overflow: 'hidden' }}>
                  <Image source={{ uri: item.artwork }} style={{ width: 100, height: 100 }} />
                  <View style={{ position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcon name="play-arrow" size={18} color={colors.primary} />
                  </View>
                </View>
                <Text style={[typography.bodySm, { color: colors.onSurface, marginTop: 6, fontWeight: '600' }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[typography.labelSm, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Library Items */}
      <FlatList
        data={libraryItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: spacing.xl }}
        ListFooterComponent={<MadeInIndiaFooter />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={item.onPress} activeOpacity={0.7}>
            {item.type === 'gradient' ? (
              <LinearGradient
                colors={['#450af5', '#8e8ee5']}
                style={styles.itemArt}
              >
                <MaterialIcon name="favorite" size={28} color="#ffffff" />
              </LinearGradient>
            ) : item.type === 'blend' ? (
              <LinearGradient
                colors={['#00b894', '#6c5ce7']}
                style={styles.itemArt}
              >
                <MaterialIcon name="group" size={28} color="#ffffff" />
              </LinearGradient>
            ) : item.type === 'icon' ? (
              <View style={[styles.itemArt, { backgroundColor: colors.surfaceContainerHighest }]}>
                <MaterialIcon name="cloud-download" size={28} color={colors.primary} />
              </View>
            ) : (
              <View style={[styles.itemArt, { backgroundColor: colors.surfaceContainer }]}>
                <MaterialIcon name="queue-music" size={28} color={colors.onSurfaceVariant} />
              </View>
            )}

            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                // Quick play first song in playlist
                if (item.id === 'liked' && likedSongs.length > 0) {
                  play(likedSongs[0], likedSongs);
                  navigation.navigate('Player');
                } else if (item.id === 'downloads' && downloads.length > 0) {
                  play(downloads[0] as any, downloads as any);
                  navigation.navigate('Player');
                } else {
                  item.onPress();
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 4 }}
            >
              <MaterialIcon name="play-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
            <MaterialIcon name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={async () => {
          const createPlaylist = useLibraryStore.getState().createPlaylist;
          await createPlaylist(`My Playlist #${playlists.length + 1}`);
        }}
      >
        <MaterialIcon name="add" size={28} color={colors.onPrimaryContainer} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandName: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  pageTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  activeChip: {
    backgroundColor: colors.primaryContainer,
  },
  chipText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  activeChipText: {
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  itemArt: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  itemSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});
