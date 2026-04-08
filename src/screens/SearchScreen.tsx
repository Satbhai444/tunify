import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { search } from '../api';
import { usePlayerStore, useLibraryStore } from '../stores';
import { Track, Album, Artist } from '../types';

const GENRES = [
  { name: 'Bollywood', icon: 'movie', gradient: ['#FF4B4B', '#4F39CC'] as [string, string] },
  { name: 'Pop', icon: 'music-note', gradient: ['#F59E0B', '#4F39CC'] as [string, string] },
  { name: 'Lo-Fi', icon: 'headset', gradient: ['#10B981', '#0D0D1F'] as [string, string] },
  { name: 'Hip-Hop', icon: 'headphones', gradient: ['#3B82F6', '#0D0D1F'] as [string, string] },
  { name: 'Rock', icon: 'whatshot', gradient: ['#8B5CF6', '#0D0D1F'] as [string, string] },
  { name: 'Chill', icon: 'spa', gradient: ['#EC4899', '#0D0D1F'] as [string, string] },
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

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

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
        <BlurView intensity={10} tint="light" style={styles.recordBlur}>
          <Image source={{ uri: item.artwork }} style={styles.recordArt} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.recordTitle, isActive && { color: colors.primary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.recordSub}>{item.artist}</Text>
          </View>
          {isActive ? (
            <MaterialIcon name="equalizer" size={18} color={colors.primary} />
          ) : (
            <MaterialIcon name="play-arrow" size={20} color="#5C5C8A" />
          )}
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F39CC', '#0D0D1F']} style={StyleSheet.absoluteFill} />
      
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Explore</Text>
        <BlurView intensity={20} tint="dark" style={styles.searchBarWrapper}>
          <MaterialIcon name="search" size={22} color="#FFF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs, artists..."
            placeholderTextColor="#A5A5C7"
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialIcon name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      {!hasSearched ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.browseContent}>
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {recentSearches.slice(0, 5).map((q) => (
                  <TouchableOpacity key={q} onPress={() => handleSearch(q)} style={styles.recentPill}>
                    <Text style={styles.recentPillText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.genreGrid}>
            {GENRES.map((g) => (
              <TouchableOpacity 
                key={g.name} 
                style={styles.genreCard}
                onPress={() => handleSearch(g.name)}
              >
                <LinearGradient colors={g.gradient} style={styles.genreGradient}>
                  <Text style={styles.genreText}>{g.name}</Text>
                  <MaterialIcon name={g.icon as any} size={24} color="rgba(255,255,255,0.3)" />
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
                style={[styles.tab, activeTab === t && styles.activeTab]}
              >
                <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {searching ? (
            <View style={styles.center}>
               <ActivityIndicator color={colors.primary} />
            </View>
          ) : activeTab === 'songs' ? (
            <FlatList
              data={results.tracks}
              keyExtractor={(item) => item.id}
              renderItem={renderTrackItem}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
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
                  <BlurView intensity={10} tint="light" style={styles.recordBlur}>
                    <Image source={{ uri: item.image }} style={[styles.recordArt, { borderRadius: 24 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.recordSub}>Artist</Text>
                    </View>
                    <MaterialIcon name="chevron-right" size={20} color="#5C5C8A" />
                  </BlurView>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
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
                  <BlurView intensity={10} tint="light" style={styles.recordBlur}>
                    <Image source={{ uri: item.artwork }} style={styles.recordArt} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.recordSub}>{item.artist}</Text>
                    </View>
                    <MaterialIcon name="chevron-right" size={20} color="#5C5C8A" />
                  </BlurView>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 150 }}
            />
          )}
        </View>
      )}
    </View>
  );
}

import { ScrollView, ActivityIndicator } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  pageTitle: {
    ...typography.headlineLg,
    color: '#FFF',
    fontWeight: '900',
    marginBottom: 20,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  browseContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: '#FFF',
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  recentPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recentPillText: {
    ...typography.labelLg,
    color: '#A5A5C7',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreCard: {
    width: '48%',
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  genreGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  genreText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.labelLg,
    color: '#A5A5C7',
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFF',
  },
  resultRow: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  recordBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  recordArt: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  recordTitle: {
    ...typography.titleSm,
    color: '#FFF',
    fontWeight: '700',
  },
  recordSub: {
    ...typography.labelSm,
    color: '#5C5C8A',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
