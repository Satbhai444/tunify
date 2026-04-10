import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { search } from '../api';
import { usePlayerStore, useLibraryStore, useSettingsStore } from '../stores';
import { Track, Album, Artist } from '../types';

const GENRES = [
  { name: 'Bollywood', icon: 'movie', gradient: ['#FF4B4B', '#FF7E5F'] as [string, string] },
  { name: 'Pop', icon: 'music-note', gradient: ['#F59E0B', '#D97706'] as [string, string] },
  { name: 'Lo-Fi', icon: 'headset', gradient: ['#10B981', '#059669'] as [string, string] },
  { name: 'Hip-Hop', icon: 'headphones', gradient: ['#3B82F6', '#2563EB'] as [string, string] },
  { name: 'Rock', icon: 'whatshot', gradient: ['#8B5CF6', '#7C3AED'] as [string, string] },
  { name: 'Chill', icon: 'spa', gradient: ['#EC4899', '#DB2777'] as [string, string] },
];

type TabType = 'songs' | 'artists' | 'albums';

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tracks: Track[]; albums: Album[]; artists: Artist[] }>({ tracks: [], albums: [], artists: [] });
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const recentSearches = useLibraryStore((s) => s.recentSearches);
  const addRecentSearch = useLibraryStore((s) => s.addRecentSearch);
  const removeRecentSearch = useLibraryStore((s) => s.removeRecentSearch);
  const clearRecentSearches = useLibraryStore((s) => s.clearRecentSearches);
  
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults({ tracks: [], albums: [], artists: [] });
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await search(text.trim());
        setResults({ tracks: res.tracks, albums: res.albums, artists: res.artists });
        setHasSearched(true);
        addRecentSearch(text.trim());
      } catch {
        setHasSearched(true);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [addRecentSearch]);

  const renderTrackItem = ({ item }: { item: Track }) => {
    const isActive = currentTrack?.id === item.id;
    return (
      <TouchableOpacity 
        style={styles.resultRow} 
        onPress={() => play(item, results.tracks)}
      >
        <BlurView intensity={themeMode === 'dark' ? 10 : 30} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.recordBlur, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
          <Image source={{ uri: item.artwork }} style={styles.recordArt} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.recordTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.recordSub, { color: theme.onSurfaceVariant }]}>{item.artist}</Text>
          </View>
          {isActive ? (
            <MaterialIcon name="equalizer" size={18} color={theme.primary} />
          ) : (
            <MaterialIcon name="play-arrow" size={20} color={theme.onSurfaceVariant} />
          )}
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient 
        colors={themeMode === 'dark' ? ['#4F39CC', theme.background] : ['#A5B4FC', theme.background]} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.onSurface }]}>Search</Text>
        <BlurView intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.searchBarWrapper, { borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <MaterialIcon name="search" size={22} color={theme.onSurfaceVariant} />
          <TextInput
            style={[styles.searchInput, { color: theme.onSurface }]}
            placeholder="What do you want to listen to?"
            placeholderTextColor={theme.onSurfaceVariant}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcon name="close" size={20} color={theme.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      {!hasSearched ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.browseContent}>
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={[styles.clearAllText, { color: theme.primary }]}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {recentSearches.slice(0, 10).map((q) => (
                  <TouchableOpacity 
                    key={q} 
                    onPress={() => handleSearch(q)} 
                    style={[styles.recentPill, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  >
                    <Text style={[styles.recentPillText, { color: theme.onSurfaceVariant }]}>{q}</Text>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(q);
                      }}
                      style={styles.pillClose}
                    >
                      <MaterialIcon name="close" size={14} color={theme.onSurfaceVariant} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Browse all</Text>
          <View style={styles.genreGrid}>
            {GENRES.map((g) => (
              <TouchableOpacity 
                key={g.name} 
                style={styles.genreCard}
                onPress={() => handleSearch(g.name)}
              >
                <LinearGradient colors={g.gradient} style={styles.genreGradient}>
                  <Text style={styles.genreText}>{g.name}</Text>
                  <MaterialIcon name={g.icon as any} size={28} color="rgba(255,255,255,0.4)" />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.tabs}>
            {(['songs', 'artists', 'albums'] as TabType[]).map((t) => (
              <TouchableOpacity 
                key={t} 
                onPress={() => setActiveTab(t)}
                style={[styles.tab, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, activeTab === t && { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.tabText, { color: theme.onSurfaceVariant }, activeTab === t && { color: '#FFF' }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {searching ? (
            <View style={styles.center}>
               <ActivityIndicator color={theme.primary} />
            </View>
          ) : activeTab === 'songs' ? (
            <FlatList
              data={results.tracks}
              keyExtractor={(item) => item.id}
              renderItem={renderTrackItem}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
              showsVerticalScrollIndicator={false}
            />
          ) : activeTab === 'artists' ? (
            <FlatList
              data={results.artists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultRow}
                  onPress={() => navigation.navigate('ArtistDetail', { artistId: item.id, artistName: item.name, artistImage: item.image })}
                >
                  <BlurView intensity={themeMode === 'dark' ? 10 : 30} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.recordBlur, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                    <Image source={{ uri: item.image }} style={[styles.recordArt, { borderRadius: 24 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recordTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.recordSub, { color: theme.onSurfaceVariant }]}>Artist</Text>
                    </View>
                    <MaterialIcon name="chevron-right" size={20} color={theme.onSurfaceVariant} />
                  </BlurView>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={results.albums}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultRow}
                  onPress={() => navigation.navigate('AlbumDetail', { albumId: item.id, albumName: item.title, albumArtwork: item.artwork })}
                >
                  <BlurView intensity={themeMode === 'dark' ? 10 : 30} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.recordBlur, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                    <Image source={{ uri: item.artwork }} style={styles.recordArt} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recordTitle, { color: theme.onSurface }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.recordSub, { color: theme.onSurfaceVariant }]}>{item.artist}</Text>
                    </View>
                    <MaterialIcon name="chevron-right" size={20} color={theme.onSurfaceVariant} />
                  </BlurView>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  pageTitle: { ...typography.displaySm, fontWeight: '900', marginBottom: 20 },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' },
  browseContent: { paddingHorizontal: 20, paddingBottom: 180 },
  section: { marginBottom: 30 },
  sectionTitle: { ...typography.titleMd, fontWeight: '800', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  clearAllText: { ...typography.labelMd, fontWeight: '700' },
  recentPill: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  recentPillText: { ...typography.labelMd, fontWeight: '600' },
  pillClose: { marginLeft: 6, padding: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  genreCard: { width: '48%', height: 110, borderRadius: 16, overflow: 'hidden' },
  genreGradient: { flex: 1, padding: 16, justifyContent: 'space-between' },
  genreText: { color: '#FFF', fontWeight: '900', fontSize: 18, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  tabText: { ...typography.labelLg, fontWeight: '700' },
  resultRow: { marginBottom: 10, borderRadius: 16, overflow: 'hidden' },
  recordBlur: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
  recordArt: { width: 52, height: 52, borderRadius: radii.md },
  recordTitle: { ...typography.titleSm, fontWeight: '700' },
  recordSub: { ...typography.labelSm, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
