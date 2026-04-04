import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, Share, ToastAndroid, Platform } from 'react-native';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { BottomSheetMenu } from '../components/BottomSheet';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { FirstTimeTooltip } from '../components/FirstTimeTooltip';
import { getTrending, getPlaylistTracks, getCuratedSection, getDeezerChart, getNewReleases, getTopPlaylists, getTopArtists, getTopAlbums } from '../api';
import { usePlayerStore, useLibraryStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Album, Artist, Playlist } from '../types';

// ─── Types ───
interface TrackSection {
  key: string;
  title: string;
  tracks: Track[];
  emoji?: string;
}

// ─── Reusable Components ───

function SectionHeader({ title, emoji, onSeeAll }: { title: string; emoji?: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{emoji ? `${emoji} ` : ''}{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8 }}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function TrackCard({ track, onPress, onLongPress }: { track: Track; onPress: () => void; onLongPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.trackCard} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8}>
      <Image source={{ uri: track.artwork }} style={styles.trackCardImage} />
      <View style={styles.trackCardOverlay}>
        <Text style={styles.trackCardTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackCardArtist} numberOfLines={1}>{track.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

function WideTrackCard({ track, onPress, onLongPress }: { track: Track; onPress: () => void; onLongPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.wideTrackCard} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8}>
      <Image source={{ uri: track.artwork }} style={styles.wideTrackCardImage} />
      <Text style={styles.wideTrackCardTitle} numberOfLines={2}>{track.title}</Text>
      <Text style={styles.wideTrackCardArtist} numberOfLines={1}>{track.artist}</Text>
    </TouchableOpacity>
  );
}

function TrackRow({ track, index, onPress, onMore }: { track: Track; index: number; onPress: () => void; onMore?: () => void }) {
  return (
    <TouchableOpacity style={styles.trackRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.trackRowIndex}>{index + 1}</Text>
      <Image source={{ uri: track.artwork }} style={styles.trackRowImage} />
      <View style={styles.trackRowInfo}>
        <Text style={styles.trackRowTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.trackRowArtist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <TouchableOpacity onPress={onMore} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <MaterialIcon name="more-vert" size={20} color={colors.onSurfaceVariant} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function AlbumCard({ album, onPress }: { album: Album; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.albumCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: album.artwork }} style={styles.albumCardImage} />
      <Text style={styles.albumCardTitle} numberOfLines={1}>{album.title}</Text>
      <Text style={styles.albumCardSubtitle} numberOfLines={1}>{album.artist}</Text>
    </TouchableOpacity>
  );
}

function ArtistBubble({ artist, onPress }: { artist: Artist; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.artistBubble} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: artist.image }} style={styles.artistBubbleImage} />
      <Text style={styles.artistBubbleName} numberOfLines={1}>{artist.name}</Text>
    </TouchableOpacity>
  );
}

function PlaylistCard({ playlist, onPress }: { playlist: Playlist; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.playlistCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: playlist.artwork }} style={styles.playlistCardImage} />
      <Text style={styles.playlistCardTitle} numberOfLines={2}>{playlist.title}</Text>
      <Text style={styles.playlistCardSubtitle} numberOfLines={1}>{playlist.trackCount} songs</Text>
    </TouchableOpacity>
  );
}

// ─── Main HomeScreen ───

export function HomeScreen({ navigation }: any) {
  const [sections, setSections] = useState<TrackSection[]>([]);
  const [newAlbums, setNewAlbums] = useState<Album[]>([]);
  const [topArtistsList, setTopArtistsList] = useState<Artist[]>([]);
  const [topAlbumsBollywood, setTopAlbumsBollywood] = useState<Album[]>([]);
  const [topAlbumsEnglish, setTopAlbumsEnglish] = useState<Album[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [moodPlaylists, setMoodPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Good Evening');
  const play = usePlayerStore((s) => s.play);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const downloads = useLibraryStore((s) => s.downloads);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const isLiked = useLibraryStore((s) => s.isLiked);
  const userName = useSettingsStore((s) => s.userName);
  const [trackMenu, setTrackMenu] = useState<Track | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [madeForYou, setMadeForYou] = useState<Track[]>([]);
  const [quickPicks, setQuickPicks] = useState<Track[]>([]);

  function showToast(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }

  const fetchData = useCallback(async () => {
    // ─── TRACK SECTIONS (songs) ───
    const trackFetchers: { key: string; title: string; emoji: string; fetcher: () => Promise<Track[]> }[] = [
      { key: 'trending', title: 'Trending Now', emoji: '🔥', fetcher: getTrending },
      { key: 'bollywood', title: 'Bollywood Hits', emoji: '🎬', fetcher: () => getPlaylistTracks('159144718', 30) },
      { key: 'charts', title: 'Global Top Charts', emoji: '🌍', fetcher: getDeezerChart },
      { key: 'hollywood', title: 'Hollywood & English Pop', emoji: '🎧', fetcher: () => getCuratedSection('latest english pop hits 2024', 20) },
      { key: 'punjabi', title: 'Punjabi Beats', emoji: '🥁', fetcher: () => getPlaylistTracks('48853326', 30) },
      { key: 'hiphop', title: 'Hip-Hop & Rap', emoji: '🎤', fetcher: () => getCuratedSection('hip hop rap best hits', 20) },
      { key: 'romantic', title: 'Love & Romance', emoji: '❤️', fetcher: () => getCuratedSection('romantic love songs hindi', 20) },
      { key: 'edm', title: 'EDM & Dance', emoji: '🎵', fetcher: () => getCuratedSection('EDM dance party songs', 20) },
      { key: 'arijit', title: 'Arijit Singh Special', emoji: '🎶', fetcher: () => getCuratedSection('Arijit Singh best songs', 20) },
      { key: 'retro', title: '90s & 2000s Throwback', emoji: '📻', fetcher: () => getCuratedSection('90s 2000s bollywood evergreen hits', 20) },
      { key: 'kpop', title: 'K-Pop Hits', emoji: '🇰🇷', fetcher: () => getCuratedSection('BTS Blackpink K-pop hits', 20) },
      { key: 'latin', title: 'Latin Vibes', emoji: '💃', fetcher: () => getCuratedSection('Bad Bunny Shakira latin reggaeton', 20) },
      { key: 'chill', title: 'Lo-Fi & Chill', emoji: '🌙', fetcher: () => getCuratedSection('lofi chill relaxing instrumental', 20) },
      { key: 'ghazal', title: 'Ghazals & Sufi', emoji: '🕌', fetcher: () => getCuratedSection('ghazal sufi best Nusrat Rahat Fateh', 20) },
      { key: 'workout', title: 'Workout Pump', emoji: '💪', fetcher: () => getCuratedSection('workout gym motivation songs', 20) },
      { key: 'party', title: 'Party Anthems', emoji: '🎉', fetcher: () => getCuratedSection('party dance bollywood dj remix', 20) },
      { key: 'devotional', title: 'Devotional & Bhajan', emoji: '🙏', fetcher: () => getCuratedSection('bhajan aarti devotional songs', 20) },
      { key: 'indie', title: 'Indie India', emoji: '🎸', fetcher: () => getCuratedSection('indie indian prateek kuhad anuv jain', 20) },
      { key: 'tamil', title: 'Tamil Hits', emoji: '🎬', fetcher: () => getCuratedSection('tamil best songs anirudh', 20) },
      { key: 'telugu', title: 'Telugu Hits', emoji: '🎬', fetcher: () => getCuratedSection('telugu best songs pushpa', 20) },
    ];

    // ─── ALBUMS, ARTISTS, PLAYLISTS (parallel) ───
    const [
      trackResults,
      newReleases,
      bwArtists,
      hwArtists,
      bwAlbums,
      enAlbums,
      fPlaylists,
      mPlaylists,
    ] = await Promise.all([
      Promise.allSettled(trackFetchers.map((f) => f.fetcher())),
      getNewReleases().catch(() => [] as Album[]),
      getTopArtists('bollywood singers', 15).catch(() => [] as Artist[]),
      getTopArtists('english pop rock artists', 15).catch(() => [] as Artist[]),
      getTopAlbums('latest bollywood albums 2024', 10).catch(() => [] as Album[]),
      getTopAlbums('latest english albums 2024', 10).catch(() => [] as Album[]),
      getTopPlaylists('bollywood party romantic chill', 10).catch(() => [] as Playlist[]),
      getTopPlaylists('mood happy sad chill workout focus', 10).catch(() => [] as Playlist[]),
    ]);

    // Build track sections
    const newSections: TrackSection[] = [];
    (trackResults as PromiseSettledResult<Track[]>[]).forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        newSections.push({
          key: trackFetchers[i].key,
          title: trackFetchers[i].title,
          tracks: result.value,
          emoji: trackFetchers[i].emoji,
        });
      }
    });

    setSections(newSections);
    setNewAlbums(newReleases);
    setTopArtistsList([...bwArtists, ...hwArtists]);
    setTopAlbumsBollywood(bwAlbums);
    setTopAlbumsEnglish(enAlbums);
    setFeaturedPlaylists(fPlaylists);
    setMoodPlaylists(mPlaylists);
    setLoading(false);
  }, []);

  const checkConnectivity = useCallback(() => {
    fetch('https://jiosavan-api2.vercel.app/api/search/songs?query=test&limit=1', { method: 'HEAD' })
      .then(() => setIsOffline(false))
      .catch(() => setIsOffline(true));
  }, []);

  useEffect(() => {
    checkConnectivity();
    // Re-check connectivity every 10 seconds
    const interval = setInterval(checkConnectivity, 10000);

    fetchData();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    return () => clearInterval(interval);
  }, [fetchData, checkConnectivity]);

  // Made for You personalization
  useEffect(() => {
    async function generateRecommendations() {
      if (likedSongs.length === 0 && recentlyPlayed.length === 0) return;
      try {
        const artistCounts = new Map<string, number>();
        [...likedSongs, ...recentlyPlayed].forEach((t) => {
          artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
        });
        const topArtists = [...artistCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);

        if (topArtists.length === 0) return;
        const query = topArtists.join(' ') + ' best songs';
        const tracks = await getCuratedSection(query, 20);
        const existingIds = new Set([...likedSongs, ...recentlyPlayed].map((t) => t.id));
        const fresh = tracks.filter((t) => !existingIds.has(t.id));
        setMadeForYou(fresh.length > 0 ? fresh : tracks.slice(0, 15));
      } catch {}
    }
    generateRecommendations();
  }, [likedSongs.length, recentlyPlayed.length]);

  // Quick Picks personalization based on listening history or onboarding preferences
  useEffect(() => {
    async function generateQuickPicks() {
      try {
        const history = [...recentlyPlayed, ...likedSongs];

        if (history.length > 0) {
          // Use listening history for returning users
          const artistCounts = new Map<string, number>();
          history.forEach((t) => {
            artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
          });
          const topArtists = [...artistCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

          if (topArtists.length > 0) {
            const query = topArtists.join(' ') + ' popular songs';
            const tracks = await getCuratedSection(query, 12);
            const existingIds = new Set(history.map((t) => t.id));
            const fresh = tracks.filter((t) => !existingIds.has(t.id));
            setQuickPicks(fresh.length >= 6 ? fresh.slice(0, 6) : tracks.slice(0, 6));
            return;
          }
        }

        // Fallback: use onboarding preferences for new users
        const prefsRaw = await AsyncStorage.getItem('tunify_preferences');
        if (prefsRaw) {
          const prefs = JSON.parse(prefsRaw);
          const parts: string[] = [];
          if (prefs.artists?.length) parts.push(...prefs.artists.slice(0, 3));
          else if (prefs.genres?.length) parts.push(...prefs.genres.slice(0, 3));
          if (parts.length > 0) {
            const query = parts.join(' ') + ' popular songs';
            const tracks = await getCuratedSection(query, 12);
            setQuickPicks(tracks.slice(0, 6));
          }
        }
      } catch {}
    }
    generateQuickPicks();
  }, [likedSongs.length, recentlyPlayed.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    checkConnectivity();
    await fetchData();
    setRefreshing(false);
  };

  const handleTrackPress = (track: Track, queue: Track[]) => {
    play(track, queue);
    navigation.navigate('Player');
  };

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('AlbumDetail', {
      albumId: album.id,
      albumName: album.title,
      albumArtwork: album.artwork,
    });
  };

  const handleArtistPress = (artist: Artist) => {
    navigation.navigate('ArtistDetail', {
      artistId: artist.id,
      artistName: artist.name,
      artistImage: artist.image,
    });
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    navigation.navigate('PlaylistDetail', {
      playlistId: playlist.id,
      title: playlist.title,
      artwork: playlist.artwork,
      description: playlist.description ?? '',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
          Loading your music...
        </Text>
      </View>
    );
  }

  // Pre-pull first 3 track sections for top of page
  const heroSection = sections[0];
  const section2 = sections[1];
  const section3 = sections[2];
  const trackIdx = 3; // next track section index

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greeting}{userName && userName !== 'Tunify User' ? `, ${userName.split(' ')[0]}` : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <MaterialIcon name="settings" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Bollywood, Hollywood, Punjabi, K-Pop & more</Text>

        {/* Quick Action Cards */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: '#1a2a1a' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Discover')}
          >
            <MaterialIcon name="explore" size={22} color={colors.primary} />
            <Text style={styles.quickActionText}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: '#2a1a2a' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Mood')}
          >
            <MaterialIcon name="mood" size={22} color="#fd79a8" />
            <Text style={styles.quickActionText}>Moods</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: '#1a1a2a' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Blend')}
          >
            <MaterialIcon name="group" size={22} color="#a29bfe" />
            <Text style={styles.quickActionText}>Blend</Text>
          </TouchableOpacity>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <MaterialIcon name="wifi-off" size={20} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>You're Offline</Text>
              <Text style={styles.offlineSubtitle}>Playing from downloads only</Text>
            </View>
            {downloads.length > 0 && (
              <TouchableOpacity onPress={() => {
                if (downloads.length > 0) {
                  play(downloads[0] as Track, downloads as Track[]);
                  navigation.navigate('Player');
                }
              }}>
                <View style={styles.offlineBtn}>
                  <Text style={styles.offlineBtnText}>Play Downloads</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ═══════ QUICK PICKS GRID (Personalized) ═══════ */}
        {(() => {
          const picks = quickPicks.length >= 6 ? quickPicks : (heroSection?.tracks?.slice(0, 6) || []);
          const pickQueue = quickPicks.length >= 6 ? quickPicks : (heroSection?.tracks || []);
          if (picks.length < 6) return null;
          return (
            <View style={styles.section}>
              <SectionHeader title="Quick Picks" emoji="⚡" />
              <View style={styles.quickPicksGrid}>
                {picks.map((track) => (
                  <TouchableOpacity
                    key={track.id}
                    style={styles.quickPickItem}
                    onPress={() => handleTrackPress(track, pickQueue)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: track.artwork }} style={styles.quickPickImage} />
                    <Text style={styles.quickPickTitle} numberOfLines={1}>{track.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })()}

        {/* ═══════ MADE FOR YOU ═══════ */}
        {madeForYou.length > 0 && !isOffline && (
          <View style={styles.section}>
            <SectionHeader title="Made for You" emoji="✨" />
            <FlatList
              data={madeForYou}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `mfy_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <WideTrackCard track={item} onPress={() => handleTrackPress(item, madeForYou)} onLongPress={() => setTrackMenu(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ RECENTLY PLAYED ═══════ */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recently Played" emoji="🕐" />
            <FlatList
              data={recentlyPlayed.slice(0, 20)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `recent_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TrackCard track={item} onPress={() => handleTrackPress(item, recentlyPlayed)} onLongPress={() => setTrackMenu(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ TRENDING (Hero carousel) ═══════ */}
        {heroSection && (
          <View style={styles.section}>
            <SectionHeader title={heroSection.title} emoji={heroSection.emoji} />
            <FlatList
              data={heroSection.tracks.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `hero_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TrackCard track={item} onPress={() => handleTrackPress(item, heroSection.tracks)} onLongPress={() => setTrackMenu(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ NEW RELEASES (Albums) ═══════ */}
        {newAlbums.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="New Releases" emoji="🆕" />
            <FlatList
              data={newAlbums.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `nra_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <AlbumCard album={item} onPress={() => handleAlbumPress(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ SECTION 2 (e.g. Bollywood Hits) ═══════ */}
        {section2 && (
          <View style={styles.section}>
            <SectionHeader title={section2.title} emoji={section2.emoji} />
            <FlatList
              data={section2.tracks.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `s2_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <TrackCard track={item} onPress={() => handleTrackPress(item, section2.tracks)} onLongPress={() => setTrackMenu(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ TOP ARTISTS ═══════ */}
        {topArtistsList.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Popular Artists" emoji="🎤" />
            <FlatList
              data={topArtistsList.slice(0, 15)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `art_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ArtistBubble artist={item} onPress={() => handleArtistPress(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ SECTION 3 (e.g. Global Charts as Top 5 list) ═══════ */}
        {section3 && (
          <View style={styles.section}>
            <SectionHeader title={section3.title} emoji={section3.emoji} />
            <View>
              {section3.tracks.slice(0, 5).map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  onPress={() => handleTrackPress(track, section3.tracks)}
                  onMore={() => setTrackMenu(track)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ═══════ FEATURED PLAYLISTS ═══════ */}
        {featuredPlaylists.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Featured Playlists" emoji="📋" />
            <FlatList
              data={featuredPlaylists}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `fpl_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <PlaylistCard playlist={item} onPress={() => handlePlaylistPress(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ BOLLYWOOD ALBUMS ═══════ */}
        {topAlbumsBollywood.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Bollywood Albums" emoji="🎬" />
            <FlatList
              data={topAlbumsBollywood}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `bwa_${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <AlbumCard album={item} onPress={() => handleAlbumPress(item)} />
              )}
            />
          </View>
        )}

        {/* ═══════ REST OF TRACK SECTIONS (interleaved with albums/playlists) ═══════ */}
        {sections.slice(trackIdx).map((section, sIndex) => {
          const globalIdx = trackIdx + sIndex;

          // Every 4th section → Top 5 list style
          if (globalIdx % 4 === 0) {
            return (
              <View key={section.key} style={styles.section}>
                <SectionHeader title={section.title} emoji={section.emoji} />
                <View>
                  {section.tracks.slice(0, 5).map((track, i) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={i}
                      onPress={() => handleTrackPress(track, section.tracks)}
                      onMore={() => setTrackMenu(track)}
                    />
                  ))}
                </View>
              </View>
            );
          }

          // Every 3rd section → Wide cards
          if (globalIdx % 3 === 0) {
            return (
              <View key={section.key} style={styles.section}>
                <SectionHeader title={section.title} emoji={section.emoji} />
                <FlatList
                  data={section.tracks.slice(0, 12)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `${section.key}_${item.id}`}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <WideTrackCard track={item} onPress={() => handleTrackPress(item, section.tracks)} onLongPress={() => setTrackMenu(item)} />
                  )}
                />
              </View>
            );
          }

          // Insert special sections at strategic points
          const insertions: React.ReactNode[] = [];

          // After 2nd remaining section → English Albums
          if (sIndex === 2 && topAlbumsEnglish.length > 0) {
            insertions.push(
              <View key="enAlbums" style={styles.section}>
                <SectionHeader title="English Albums" emoji="💿" />
                <FlatList
                  data={topAlbumsEnglish}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `ena_${item.id}`}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <AlbumCard album={item} onPress={() => handleAlbumPress(item)} />
                  )}
                />
              </View>
            );
          }

          // After 5th remaining section → Mood Playlists
          if (sIndex === 5 && moodPlaylists.length > 0) {
            insertions.push(
              <View key="moodPl" style={styles.section}>
                <SectionHeader title="Mood Playlists" emoji="😌" />
                <FlatList
                  data={moodPlaylists}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `mpl_${item.id}`}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <PlaylistCard playlist={item} onPress={() => handlePlaylistPress(item)} />
                  )}
                />
              </View>
            );
          }

          // After 8th → Liked songs shortcut
          if (sIndex === 8 && likedSongs.length > 0) {
            insertions.push(
              <View key="likedShortcut" style={styles.section}>
                <SectionHeader title="Your Liked Songs" emoji="💚" />
                <FlatList
                  data={likedSongs.slice(0, 15)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `liked_${item.id}`}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <TrackCard track={item} onPress={() => handleTrackPress(item, likedSongs)} onLongPress={() => setTrackMenu(item)} />
                  )}
                />
              </View>
            );
          }

          return (
            <React.Fragment key={section.key}>
              {/* Default: horizontal carousel */}
              <View style={styles.section}>
                <SectionHeader title={section.title} emoji={section.emoji} />
                <FlatList
                  data={section.tracks.slice(0, 15)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `${section.key}_${item.id}`}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <TrackCard track={item} onPress={() => handleTrackPress(item, section.tracks)} onLongPress={() => setTrackMenu(item)} />
                  )}
                />
              </View>
              {insertions}
            </React.Fragment>
          );
        })}

        <MadeInIndiaFooter />
        <View style={{ height: 100 }} />
      </ScrollView>

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
              icon: isLiked(trackMenu.id) ? 'favorite' : 'favorite-border',
              label: isLiked(trackMenu.id) ? 'Remove from Liked' : 'Add to Liked Songs',
              color: isLiked(trackMenu.id) ? colors.error : colors.primary,
              onPress: () => {
                const wasLiked = isLiked(trackMenu.id);
                toggleLike(trackMenu);
                showToast(wasLiked ? 'Removed from Liked' : 'Added to Liked Songs');
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
      <FirstTimeTooltip screen="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greeting: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  seeAllText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  horizontalList: {
    gap: 14,
  },

  // ─── Offline Banner ───
  offlineBanner: {
    backgroundColor: '#FF6B35',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offlineTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  offlineSubtitle: { color: '#ffffffcc', fontSize: 11 },
  offlineBtn: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  offlineBtnText: { color: '#FF6B35', fontWeight: '700', fontSize: 12 },

  // ─── Track Card (small square) ───
  trackCard: {
    width: 150,
    height: 150,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  trackCardImage: {
    width: '100%',
    height: '100%',
  },
  trackCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  trackCardTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  trackCardArtist: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ─── Wide Track Card ───
  wideTrackCard: {
    width: 170,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  wideTrackCardImage: {
    width: 170,
    height: 170,
    borderRadius: radii.md,
  },
  wideTrackCardTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  wideTrackCardArtist: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    paddingHorizontal: 2,
    marginTop: 2,
  },

  // ─── Track Row (vertical list) ───
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  trackRowIndex: {
    width: 20,
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '700',
  },
  trackRowImage: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  trackRowInfo: {
    flex: 1,
  },
  trackRowTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  trackRowArtist: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // ─── Album Card ───
  albumCard: {
    width: 150,
    marginRight: 0,
  },
  albumCardImage: {
    width: 150,
    height: 150,
    borderRadius: radii.md,
  },
  albumCardTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
    marginTop: 8,
  },
  albumCardSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // ─── Artist Bubble ───
  artistBubble: {
    alignItems: 'center',
    width: 100,
  },
  artistBubbleImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceContainer,
  },
  artistBubbleName: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // ─── Playlist Card ───
  playlistCard: {
    width: 150,
  },
  playlistCardImage: {
    width: 150,
    height: 150,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
  },
  playlistCardTitle: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
    marginTop: 8,
  },
  playlistCardSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // ─── Quick Picks Grid ───
  quickPicksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.sm,
    overflow: 'hidden',
    width: '48%' as any,
    height: 56,
  },
  quickPickImage: {
    width: 56,
    height: 56,
  },
  quickPickTitle: {
    flex: 1,
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '600',
    paddingHorizontal: 10,
  },

  // ─── Quick Action Cards ───
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    gap: 6,
  },
  quickActionText: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
  },
});
