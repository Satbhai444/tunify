import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { useLibraryStore, usePlayerStore } from '../stores';

const { width: SCREEN_W } = Dimensions.get('window');

function GlassLibraryItem({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <View style={styles.glassItemContainer}>
      <BlurView intensity={20} tint="dark" style={styles.glassItemBlur}>
        <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7}>
          {item.type === 'gradient' ? (
            <LinearGradient colors={['#7B61FF', '#4F39CC']} style={styles.itemArt}>
              <MaterialIcon name="favorite" size={24} color="#FFF" />
            </LinearGradient>
          ) : item.type === 'blend' ? (
            <LinearGradient colors={['#00C9FF', '#92FE9D']} style={styles.itemArt}>
              <MaterialIcon name="group" size={24} color="#FFF" />
            </LinearGradient>
          ) : item.type === 'icon' ? (
            <View style={[styles.itemArt, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <MaterialIcon name="download-for-offline" size={24} color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.itemArt, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <MaterialIcon name="library-music" size={24} color="#A5A5C7" />
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
          </View>
          
          <MaterialIcon name="chevron-right" size={20} color="#5C5C8A" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

export function LibraryScreen({ navigation }: any) {
  const playlists = useLibraryStore((s) => s.playlists);
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const downloads = useLibraryStore((s) => s.downloads);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const play = usePlayerStore((s) => s.play);

  const [activeFilter, setActiveFilter] = React.useState<string>('Playlists');
  const filters = ['Playlists', 'Artists', 'Albums', 'Downloads'];

  const libraryItems = [
    {
      id: 'liked',
      title: 'Liked Songs',
      subtitle: `${likedSongs.length} songs`,
      type: 'gradient',
      onPress: () => navigation.navigate('LikedSongs'),
    },
    {
      id: 'downloads',
      title: 'Downloads',
      subtitle: `${downloads.length} songs`,
      type: 'icon',
      onPress: () => {
        if (downloads.length > 0) {
          navigation.navigate('PlaylistDetail', { playlistId: '__downloads__', title: 'Downloads' });
        } else {
          Alert.alert('No Downloads', 'Songs you download will appear here.');
        }
      },
    },
    ...playlists.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: `Playlist • ${p.trackIds.length} tracks`,
      type: 'playlist',
      onPress: () => navigation.navigate('PlaylistDetail', { playlistId: p.id, title: p.title }),
    })),
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F39CC', '#16162E', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Library</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
               <View style={styles.iconCircle}>
                  <MaterialIcon name="settings" size={20} color="#FFF" />
               </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, activeFilter === f && styles.activeChip]}
                onPress={() => setActiveFilter(f)}
              >
                {activeFilter === f && (
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                )}
                <Text style={[styles.chipText, activeFilter === f && styles.activeChipText]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={libraryItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {recentlyPlayed.length > 0 && (
              <View style={styles.recentsSection}>
                <Text style={styles.sectionTitle}>Recently Played</Text>
                <FlatList
                  data={recentlyPlayed.slice(0, 8)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `recent_${item.id}`}
                  contentContainerStyle={{ gap: 16 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.recentItem}
                      onPress={() => {
                        play(item, recentlyPlayed);
                        navigation.navigate('Player');
                      }}
                    >
                      <Image source={{ uri: item.artwork }} style={styles.recentImage} />
                      <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Collections</Text>
          </>
        }
        renderItem={({ item }) => (
          <GlassLibraryItem item={item} onPress={item.onPress} />
        )}
        ListFooterComponent={<MadeInIndiaFooter />}
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
        <BlurView intensity={30} tint="light" style={styles.fabBlur}>
          <MaterialIcon name="add" size={28} color="#FFF" />
        </BlurView>
      </TouchableOpacity>

      <FirstTimeTooltip screen="library" />
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
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    ...typography.displaySm,
    color: colors.onSurface,
    fontWeight: '800',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterScroll: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 40,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    ...typography.labelLg,
    color: '#A5A5C7',
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '800',
    marginBottom: 16,
  },
  recentsSection: {
    marginTop: 12,
  },
  recentItem: {
    width: 110,
    marginRight: 16,
  },
  recentImage: {
    width: 110,
    height: 110,
    borderRadius: 24,
    marginBottom: 8,
  },
  recentTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    textAlign: 'center',
  },

  // ─── Glass Item ───
  glassItemContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  glassItemBlur: {
    padding: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemArt: {
    width: 52,
    height: 52,
    borderRadius: 16,
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
    color: '#A5A5C7',
    marginTop: 4,
  },

  // ─── FAB ───
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  fabBlur: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
