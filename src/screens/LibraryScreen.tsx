import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, Dimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { useLibraryStore, usePlayerStore, useSettingsStore } from '../stores';

const { width: SCREEN_W } = Dimensions.get('window');

function GlassLibraryItem({ item, onPress, onLongPress, themeMode }: { item: any; onPress: () => void; onLongPress?: () => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={[styles.glassItemContainer, { borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <BlurView intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.glassItemBlur}>
        <TouchableOpacity 
          style={styles.listItem} 
          onPress={onPress} 
          onLongPress={onLongPress}
          activeOpacity={0.7}
        >
          {item.type === 'gradient' ? (
            <LinearGradient colors={['#7B61FF', '#4F39CC']} style={styles.itemArt}>
              <MaterialIcon name="favorite" size={24} color="#FFF" />
            </LinearGradient>
          ) : item.type === 'blend' ? (
            <LinearGradient colors={['#00C9FF', '#92FE9D']} style={styles.itemArt}>
              <MaterialIcon name="group" size={24} color="#FFF" />
            </LinearGradient>
          ) : item.type === 'icon' ? (
            <View style={[styles.itemArt, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <MaterialIcon name="download-for-offline" size={24} color={theme.primary} />
            </View>
          ) : (
            <View style={[styles.itemArt, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <MaterialIcon name="library-music" size={24} color={theme.onSurfaceVariant} />
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.itemSubtitle, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.subtitle}</Text>
          </View>
          
          <MaterialIcon name="chevron-right" size={20} color={theme.onSurfaceVariant} />
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
  const renamePlaylist = useLibraryStore((s) => s.renamePlaylist);
  const play = usePlayerStore((s) => s.play);
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  const [activeFilter, setActiveFilter] = React.useState<string>('Playlists');
  const filters = ['Playlists', 'Artists', 'Albums', 'Downloads'];

  const handleRename = (id: string, currentTitle: string) => {
    Alert.prompt(
      'Rename Playlist',
      'Enter a new name',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Rename', 
          onPress: (name?: string) => {
            const trimmed = (name || '').trim();
            if (trimmed) {
              renamePlaylist(id, trimmed);
            }
          } 
        }
      ],
      'plain-text',
      currentTitle
    );
  };

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
      onLongPress: () => handleRename(p.id, p.title),
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={themeMode === 'dark' ? ['#4F39CC', '#16162E', theme.background] : ['#A5B4FC', '#FFFFFF', theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: theme.onSurface }]}>Library</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
               <View style={[styles.iconCircle, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <MaterialIcon name="settings" size={20} color={theme.onSurface} />
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
                style={[styles.chip, activeFilter === f && { backgroundColor: theme.primary, borderColor: 'transparent' }]}
                onPress={() => setActiveFilter(f)}
              >
                {activeFilter === f && (
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                )}
                <Text style={[styles.chipText, activeFilter === f && { color: '#FFF' }]}>{f}</Text>
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
                <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Recently Played</Text>
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
                      <Text style={[styles.recentTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            <Text style={[styles.sectionTitle, { marginTop: 24, color: theme.onSurface }]}>Collections</Text>
          </>
        }
        renderItem={({ item }) => (
          <GlassLibraryItem item={item} onPress={item.onPress} onLongPress={item.onLongPress} themeMode={themeMode} />
        )}
        ListFooterComponent={<MadeInIndiaFooter />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        activeOpacity={0.8}
        onPress={() => {
          Alert.prompt(
            'New Playlist',
            'Enter a name for your playlist',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Create',
                onPress: (name?: string) => {
                  const trimmed = (name || '').trim();
                  if (trimmed) {
                    useLibraryStore.getState().createPlaylist(trimmed);
                  } else {
                    useLibraryStore.getState().createPlaylist(`My Playlist #${playlists.length + 1}`);
                  }
                },
              },
            ],
            'plain-text',
            `My Playlist #${playlists.length + 1}`
          );
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
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: 60, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { ...typography.displaySm, fontWeight: '800' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterScroll: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
  filterRow: { flexDirection: 'row', gap: 10, paddingRight: 40 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipText: { ...typography.labelLg, color: '#A5A5C7', fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  sectionTitle: { ...typography.headlineSm, fontWeight: '800', marginBottom: 16 },
  recentsSection: { marginTop: 12 },
  recentItem: { width: 110, marginRight: 16 },
  recentImage: { width: 110, height: 110, borderRadius: 24, marginBottom: 8 },
  recentTitle: { ...typography.labelLg, textAlign: 'center' },
  glassItemContainer: { borderRadius: 24, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  glassItemBlur: { padding: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemArt: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { ...typography.titleMd, fontWeight: '700' },
  itemSubtitle: { ...typography.bodySm, marginTop: 4 },
  fab: { position: 'absolute', bottom: 110, right: 24, width: 60, height: 60, borderRadius: 30, overflow: 'hidden', elevation: 8, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  fabBlur: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});
