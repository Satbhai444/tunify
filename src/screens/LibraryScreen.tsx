import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, Dimensions, ScrollView, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { useLibraryStore, usePlayerStore, useSettingsStore } from '../stores';
import { AVATAR_OPTIONS } from '../stores/settingsStore';

const { width: SCREEN_W } = Dimensions.get('window');

function GlassLibraryItem({ item, onPress, onLongPress, themeMode }: { item: any; onPress: () => void; onLongPress?: () => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={[styles.glassItemContainer, { borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <BlurView intensity={themeMode === 'dark' ? 20 : 40} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.glassItemBlur}>
        <TouchableOpacity 
          style={styles.listItem} 
          onPress={onPress} 
          onLongPress={onLongPress}
          activeOpacity={0.7}
        >
          {item.type === 'gradient' ? (
            <LinearGradient colors={['#764BA2', '#667EEA']} style={styles.itemArt}>
              <MaterialIcon name="favorite" size={24} color="#FFF" />
            </LinearGradient>
          ) : item.type === 'download' ? (
            <LinearGradient colors={['#FF9A9E', '#FAD0C4']} style={styles.itemArt}>
              <MaterialIcon name="download-for-offline" size={24} color="#FFF" />
            </LinearGradient>
          ) : (
            <View style={[styles.itemArt, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <MaterialIcon name={item.type === 'playlist' ? 'playlist-play' : 'library-music'} size={24} color={theme.primary} />
            </View>
          )}

          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.itemSubtitle, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.subtitle}</Text>
          </View>
          
          <MaterialIcon name="chevron-right" size={24} color={theme.onSurfaceVariant} />
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
  const { themeMode, avatarId } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = React.useState<string>('All');
  const filters = ['All', 'Playlists', 'Downloads', 'Liked'];

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
            if (trimmed) renamePlaylist(id, trimmed);
          } 
        }
      ],
      'plain-text',
      currentTitle
    );
  };

  const getFilteredItems = () => {
    let items = [
      {
        id: 'liked',
        title: 'Liked Songs',
        subtitle: `${likedSongs.length} songs`,
        type: 'gradient',
        category: 'Liked',
        onPress: () => navigation.navigate('LikedSongs'),
      },
      {
        id: 'downloads',
        title: 'Downloads',
        subtitle: `${downloads.length} songs`,
        type: 'download',
        category: 'Downloads',
        onPress: () => navigation.navigate('PlaylistDetail', { playlistId: '__downloads__', title: 'Downloads' }),
      },
      ...playlists.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: `Playlist • ${p.trackIds.length} tracks`,
        type: 'playlist',
        category: 'Playlists',
        onPress: () => navigation.navigate('PlaylistDetail', { playlistId: p.id, title: p.title }),
        onLongPress: () => handleRename(p.id, p.title),
      })),
    ];

    if (activeFilter !== 'All') {
      items = items.filter(i => i.category === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(query));
    }

    return items;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={themeMode === 'dark' ? ['#2D1B69', '#16162E', theme.background] : ['#EEF2FF', '#FFFFFF', theme.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: theme.onSurface }]}>Library</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
             <LinearGradient colors={selectedAvatar.bg} style={styles.avatarCircle}>
                <Text style={{ fontSize: 18 }}>{selectedAvatar.emoji}</Text>
             </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <BlurView intensity={themeMode === 'dark' ? 30 : 50} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.searchBlur}>
            <MaterialIcon name="search" size={22} color={theme.onSurfaceVariant} style={{ marginLeft: 12 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.onSurface }]}
              placeholder="Search playlists, liked songs..."
              placeholderTextColor={theme.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcon name="close" size={20} color={theme.onSurfaceVariant} style={{ marginRight: 12 }} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && { backgroundColor: theme.primary, borderColor: 'transparent' }]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.chipText, { color: activeFilter === f ? '#FFF' : theme.onSurfaceVariant }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={getFilteredItems()}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {recentlyPlayed.length > 0 && !searchQuery && activeFilter === 'All' && (
              <View style={styles.recentsSection}>
                <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Jump Back In</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                  {recentlyPlayed.slice(0, 10).map((item) => (
                    <TouchableOpacity 
                      key={`recent_${item.id}`}
                      style={styles.recentItem}
                      onPress={() => { play(item, recentlyPlayed); navigation.navigate('Player'); }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recentImageContainer}>
                         <Image source={{ uri: item.artwork }} style={styles.recentImage} />
                         <View style={styles.recentPlayIdx}>
                            <MaterialIcon name="play-arrow" size={16} color="#FFF" />
                         </View>
                      </View>
                      <Text style={[styles.recentTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.recentArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Text style={[styles.sectionTitle, { marginTop: 32, color: theme.onSurface }]}>Your Collections</Text>
          </>
        }
        renderItem={({ item }) => (
          <GlassLibraryItem item={item} onPress={item.onPress} onLongPress={'onLongPress' in item ? (item as any).onLongPress : undefined} themeMode={themeMode} />
        )}
        ListFooterComponent={<View style={{ marginTop: 20 }}><MadeInIndiaFooter /></View>}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        activeOpacity={0.9}
        onPress={() => {
          Alert.prompt('New Playlist', 'Enter name', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create',
              onPress: (name: string | undefined) => {
                const title = (name || '').trim() || `My Playlist #${playlists.length + 1}`;
                useLibraryStore.getState().createPlaylist(title);
              },
            },
          ]);
        }}
      >
        <LinearGradient colors={['rgba(255,255,255,0.2)', 'transparent']} style={styles.fabBlur}>
          <MaterialIcon name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <FirstTimeTooltip screen="library" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { ...typography.displaySm, fontWeight: '900', letterSpacing: -1 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOpacity: 0.2 },
  searchWrapper: { marginBottom: 20, height: 50 },
  searchBlur: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, ...typography.bodyLg, paddingHorizontal: 10, height: '100%' },
  filterRow: { gap: 10, paddingBottom: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipText: { ...typography.labelLg, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 160 },
  sectionTitle: { ...typography.titleLg, fontWeight: '800', marginBottom: 16 },
  recentItem: { width: 120 },
  recentImageContainer: { width: 120, height: 120, borderRadius: 28, overflow: 'hidden', marginBottom: 10, elevation: 5 },
  recentImage: { width: '100%', height: '100%' },
  recentPlayIdx: { position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { ...typography.labelLg, fontWeight: '700' },
  recentArtist: { ...typography.bodySm, marginTop: 2, opacity: 0.7 },
  glassItemContainer: { borderRadius: 28, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  glassItemBlur: { padding: 14 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemArt: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { ...typography.titleMd, fontWeight: '800' },
  itemSubtitle: { ...typography.bodySm, marginTop: 4, opacity: 0.7 },
  fab: { position: 'absolute', bottom: 170, right: 24, width: 64, height: 64, borderRadius: 32, overflow: 'hidden', elevation: 8 },
  fabBlur: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  recentsSection: { marginBottom: 12 },
});
