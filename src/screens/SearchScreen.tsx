import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { search } from '../api';
import { usePlayerStore, useLibraryStore } from '../stores';
import { Track, Album, Artist } from '../types';

const GENRES = [
  { name: 'Bollywood', icon: 'movie', gradient: ['#dc2626', '#9a3412'] as [string, string] },
  { name: 'Pop', icon: 'music-note', gradient: ['#ec4899', '#be123c'] as [string, string] },
  { name: 'Hip-Hop', icon: 'headphones', gradient: ['#f97316', '#b45309'] as [string, string] },
  { name: 'Indie', icon: 'piano', gradient: ['#14b8a6', '#065f46'] as [string, string] },
  { name: 'Rock', icon: 'whatshot', gradient: ['#9333ea', '#312e81'] as [string, string] },
  { name: 'Chill', icon: 'spa', gradient: ['#3b82f6', '#155e75'] as [string, string] },
  { name: 'Workout', icon: 'fitness-center', gradient: ['#84cc16', '#15803d'] as [string, string] },
  { name: 'Romance', icon: 'favorite', gradient: ['#c026d3', '#831843'] as [string, string] },
  { name: 'Punjabi', icon: 'audiotrack', gradient: ['#f59e0b', '#d97706'] as [string, string] },
  { name: 'K-Pop', icon: 'star', gradient: ['#06b6d4', '#0e7490'] as [string, string] },
  { name: 'Lo-Fi', icon: 'headset', gradient: ['#6366f1', '#4338ca'] as [string, string] },
  { name: 'EDM', icon: 'equalizer', gradient: ['#10b981', '#047857'] as [string, string] },
  { name: 'Classical', icon: 'library-music', gradient: ['#78716c', '#44403c'] as [string, string] },
  { name: 'Party', icon: 'celebration', gradient: ['#f43f5e', '#e11d48'] as [string, string] },
  { name: 'Devotional', icon: 'self-improvement', gradient: ['#fbbf24', '#b45309'] as [string, string] },
  { name: 'Ghazals', icon: 'mic', gradient: ['#a78bfa', '#7c3aed'] as [string, string] },
];

type TabType = 'songs' | 'artists' | 'albums';

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tracks: Track[]; albums: Album[]; artists: Artist[] }>({ tracks: [], albums: [], artists: [] });
  const [activeTab, setActiveTab] = useState<TabType>('songs');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const play = usePlayerStore((s) => s.play);
  const addRecentSearch = useLibraryStore((s) => s.addRecentSearch);
  const recentSearches = useLibraryStore((s) => s.recentSearches);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
      } catch (e) {
        console.error('Search failed:', e);
        setHasSearched(true);
      } finally {
        setSearching(false);
      }
      addRecentSearch(text.trim());
    }, 500);
  }, [addRecentSearch]);

  const handleTrackPress = (track: Track) => {
    play(track, results.tracks);
    navigation.navigate('Player');
  };

  const handleGenrePress = (genre: string) => {
    handleSearch(genre);
  };

  const renderTrack = ({ item }: { item: Track }) => (
    <TouchableOpacity style={styles.trackRow} onPress={() => handleTrackPress(item)} activeOpacity={0.7}>
      <Image source={{ uri: item.artwork }} style={styles.trackArt} />
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.trackDuration}>
        {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );

  const renderArtist = ({ item }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.artistItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ArtistDetail', {
        artistId: item.id,
        artistName: item.name,
        artistImage: item.image,
      })}
    >
      <Image source={{ uri: item.image }} style={styles.artistImage} />
      <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderAlbum = ({ item }: { item: Album }) => (
    <TouchableOpacity
      style={styles.albumItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('AlbumDetail', {
        albumId: item.id,
        albumName: item.title,
        albumArtwork: item.artwork,
      })}
    >
      <Image source={{ uri: item.artwork }} style={styles.albumArt} />
      <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Search</Text>
        <View style={styles.searchBar}>
          <MaterialIcon name="search" size={22} color={colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Songs, artists, or albums"
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcon name="close" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!hasSearched ? (
        /* Browse Categories */
        <FlatList
          data={GENRES}
          numColumns={2}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.genreGrid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {recentSearches.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                  {recentSearches.slice(0, 5).map((q) => (
                    <TouchableOpacity key={q} onPress={() => handleSearch(q)} style={styles.recentItem}>
                      <MaterialIcon name="history" size={18} color={colors.onSurfaceVariant} />
                      <Text style={styles.recentText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.browseTitle}>Browse Categories</Text>
            </>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.genreCard}
              onPress={() => handleGenrePress(item.name)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={item.gradient} style={styles.genreGradient}>
                <MaterialIcon name={item.icon as any} size={28} color="rgba(255,255,255,0.3)" />
                <Text style={styles.genreName}>{item.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          ListFooterComponent={<><MadeInIndiaFooter /><View style={{ height: 100 }} /></>}
        />
      ) : (
        /* Search Results */
        <View style={{ flex: 1 }}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {(['songs', 'artists', 'albums'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'songs' && (
            <FlatList
              data={results.tracks}
              keyExtractor={(item) => item.id}
              renderItem={renderTrack}
              contentContainerStyle={{ paddingBottom: 160 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{searching ? 'Searching...' : 'No songs found'}</Text>
              }
              ListFooterComponent={<MadeInIndiaFooter />}
            />
          )}
          {activeTab === 'artists' && (
            <FlatList
              data={results.artists}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={renderArtist}
              contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: spacing.xl }}
              columnWrapperStyle={{ gap: 16 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No artists found</Text>
              }
              ListFooterComponent={<MadeInIndiaFooter />}
            />
          )}
          {activeTab === 'albums' && (
            <FlatList
              data={results.albums}
              numColumns={2}
              keyExtractor={(item) => item.id}
              renderItem={renderAlbum}
              contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: spacing.xl }}
              columnWrapperStyle={{ gap: 12 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No albums found</Text>
              }
              ListFooterComponent={<MadeInIndiaFooter />}
            />
          )}
        </View>
      )}
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
    paddingBottom: 16,
  },
  pageTitle: {
    ...typography.displaySm,
    color: colors.onSurface,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 9999,
    paddingHorizontal: 20,
    height: 56,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  browseTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    marginBottom: 16,
  },
  genreGrid: {
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  genreCard: {
    flex: 1,
    height: 100,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  genreGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  genreName: {
    ...typography.titleMd,
    color: '#ffffff',
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainerHighest,
  },
  activeTab: {
    backgroundColor: colors.primaryContainer,
  },
  tabText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  activeTabText: {
    color: colors.onPrimaryContainer,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    gap: 12,
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  trackArtist: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  trackDuration: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  artistItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  artistImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  artistName: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  albumItem: {
    flex: 1,
    marginBottom: 16,
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  albumTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  albumArtist: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 40,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  recentText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
