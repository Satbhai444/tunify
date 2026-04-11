import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore, usePlayerStore } from '../stores';
import { searchSongs } from '../api/musicService';
import type { Track } from '../types/music';

const { width: SCREEN_W } = Dimensions.get('window');

/* ──────────── Friend Profiles ──────────── */
interface FriendProfile {
  id: string;
  name: string;
  avatar: string; // emoji
  genres: string[];
  artists: string[];
  gradient: [string, string];
}

const FRIEND_PROFILES: FriendProfile[] = [
  { id: 'bollywood', name: 'Bollywood Buff', avatar: '🎬', genres: ['Bollywood', 'Romance', 'Party'], artists: ['Arijit Singh', 'Shreya Ghoshal', 'Pritam'], gradient: ['#ff6b6b', '#ee5a24'] },
  { id: 'pop', name: 'Pop Star', avatar: '⭐', genres: ['Pop', 'Dance', 'Electronic'], artists: ['Taylor Swift', 'Dua Lipa', 'The Weeknd'], gradient: ['#a29bfe', '#6c5ce7'] },
  { id: 'hiphop', name: 'Hip-Hop Head', avatar: '🔥', genres: ['Hip-Hop', 'Rap', 'Trap'], artists: ['Drake', 'Kendrick Lamar', 'Travis Scott'], gradient: ['#fdcb6e', '#e17055'] },
  { id: 'rock', name: 'Rock Legend', avatar: '🎸', genres: ['Rock', 'Alternative', 'Metal'], artists: ['Coldplay', 'Imagine Dragons', 'Linkin Park'], gradient: ['#636e72', '#2d3436'] },
  { id: 'indie', name: 'Indie Soul', avatar: '🌿', genres: ['Indie', 'Lo-Fi', 'Acoustic'], artists: ['Prateek Kuhad', 'Anuv Jain', 'The Local Train'], gradient: ['#55efc4', '#00b894'] },
  { id: 'punjabi', name: 'Punjabi Vibe', avatar: '🦁', genres: ['Punjabi', 'Bhangra', 'Party'], artists: ['Diljit Dosanjh', 'AP Dhillon', 'Sidhu Moose Wala'], gradient: ['#fd79a8', '#e84393'] },
  { id: 'kpop', name: 'K-Pop Stan', avatar: '💜', genres: ['K-Pop', 'Pop', 'Dance'], artists: ['BTS', 'BLACKPINK', 'Stray Kids'], gradient: ['#dfe6e9', '#b2bec3'] },
  { id: 'classical', name: 'Classical Mind', avatar: '🎻', genres: ['Classical', 'Ghazals', 'Devotional'], artists: ['AR Rahman', 'Jagjit Singh', 'Lata Mangeshkar'], gradient: ['#fab1a0', '#e17055'] },
];

/* ──────────── Taste analysis helpers ──────────── */
function analyzeUserTaste(likedSongs: Track[], recentlyPlayed: Track[]) {
  const artistCount: Record<string, number> = {};
  const allTracks = [...likedSongs, ...recentlyPlayed];

  allTracks.forEach((t) => {
    const a = t.artist?.split(',')[0]?.trim() || 'Unknown';
    artistCount[a] = (artistCount[a] || 0) + 1;
  });

  const topArtists = Object.entries(artistCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return { topArtists, totalTracks: allTracks.length };
}

function computeTasteMatch(userArtists: string[], friendProfile: FriendProfile): number {
  if (userArtists.length === 0) return Math.floor(Math.random() * 30) + 40; // 40-70 if no data
  const userLower = userArtists.map((a) => a.toLowerCase());
  const friendLower = friendProfile.artists.map((a) => a.toLowerCase());
  let overlap = 0;
  friendLower.forEach((fa) => {
    if (userLower.some((ua) => ua.includes(fa) || fa.includes(ua))) overlap++;
  });
  const base = Math.min(95, Math.floor((overlap / Math.max(friendLower.length, 1)) * 60) + 35 + Math.floor(Math.random() * 15));
  return base;
}

/* ──────────── DNA Ring animation ──────────── */
function TasteRing({ percentage, size = 140, color }: { percentage: number; size?: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.surfaceContainerHighest,
        }}
      />
      {/* Colored ring segments (simplified visual) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          opacity: anim,
          transform: [
            {
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${(percentage / 100) * 360}deg`],
              }),
            },
          ],
        }}
      />
      {/* Center label */}
      <Animated.Text
        style={{
          ...typography.displaySm,
          color: colors.onSurface,
          fontWeight: '800',
          opacity: anim,
        }}
      >
        {percentage}%
      </Animated.Text>
      <Text style={[typography.labelSm, { color: colors.onSurfaceVariant, marginTop: -2 }]}>match</Text>
    </View>
  );
}

/* ──────────── MAIN SCREEN ──────────── */
type BlendPhase = 'pick' | 'loading' | 'result';

export function BlendScreen({ navigation }: any) {
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const play = usePlayerStore((s) => s.play);

  const [phase, setPhase] = useState<BlendPhase>('pick');
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [blendTracks, setBlendTracks] = useState<Track[]>([]);
  const [tasteMatch, setTasteMatch] = useState(0);
  const [userTaste, setUserTaste] = useState<{ topArtists: string[]; totalTracks: number }>({ topArtists: [], totalTracks: 0 });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const taste = analyzeUserTaste(likedSongs, recentlyPlayed);
    setUserTaste(taste);
  }, [likedSongs, recentlyPlayed]);

  const startBlend = useCallback(async (friend: FriendProfile) => {
    setSelectedFriend(friend);
    setPhase('loading');

    // Compute match
    const match = computeTasteMatch(userTaste.topArtists, friend);
    setTasteMatch(match);

    // Build search queries mixing user artists + friend genres/artists
    const queries: string[] = [];
    // Add friend's genres/artists
    friend.genres.forEach((g) => queries.push(g));
    friend.artists.slice(0, 2).forEach((a) => queries.push(a));
    // Add user's top artist if available
    if (userTaste.topArtists.length > 0) {
      queries.push(userTaste.topArtists[0]);
    }

    // Fetch tracks from mixed queries
    const allTracks: Track[] = [];
    const seenIds = new Set<string>();

    const fetchPromises = queries.slice(0, 4).map((q) =>
      searchSongs(q).catch(() => [] as Track[]),
    );
    const results = await Promise.all(fetchPromises);

    results.forEach((tracks) => {
      tracks.forEach((t) => {
        if (!seenIds.has(t.id) && allTracks.length < 25) {
          seenIds.add(t.id);
          allTracks.push(t);
        }
      });
    });

    // Shuffle for blend feel
    for (let i = allTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
    }

    setBlendTracks(allTracks.slice(0, 20));

    // Animate in
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    setPhase('result');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [userTaste, fadeAnim, slideAnim]);

  const goBack = useCallback(() => {
    if (phase === 'result' || phase === 'loading') {
      setPhase('pick');
      setSelectedFriend(null);
      setBlendTracks([]);
    } else {
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main');
    }
  }, [phase, navigation]);

  /* ──────────── PICK FRIEND PHASE ──────────── */
  const renderPickPhase = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Taste summary card */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.tasteCard}>
        <View style={styles.tasteCardHeader}>
          <View style={styles.tasteAvatar}>
            <Text style={{ fontSize: 32 }}>🎧</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[typography.titleLg, { color: colors.onSurface, fontWeight: '700' }]}>Your Taste DNA</Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {userTaste.totalTracks > 0
                ? `Based on ${userTaste.totalTracks} songs`
                : 'Start listening to build your profile'}
            </Text>
          </View>
        </View>
        {userTaste.topArtists.length > 0 && (
          <View style={styles.topArtistsRow}>
            <Text style={[typography.labelMd, { color: colors.onSurfaceVariant, marginBottom: 8 }]}>TOP ARTISTS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {userTaste.topArtists.map((a) => (
                <View key={a} style={styles.artistChip}>
                  <Text style={[typography.bodySm, { color: colors.primary }]}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Pick a friend */}
      <Text style={[typography.titleLg, { color: colors.onSurface, fontWeight: '700', marginHorizontal: spacing.xl, marginTop: 28, marginBottom: 6 }]}>
        Create a Blend
      </Text>
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginHorizontal: spacing.xl, marginBottom: 20 }]}>
        Pick a music persona to blend your taste with
      </Text>

      <View style={styles.friendGrid}>
        {FRIEND_PROFILES.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendCard}
            activeOpacity={0.7}
            onPress={() => startBlend(friend)}
          >
            <LinearGradient colors={friend.gradient} style={styles.friendGradient}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{friend.avatar}</Text>
              <Text style={[typography.titleSm, { color: '#fff', fontWeight: '700', textAlign: 'center' }]}>{friend.name}</Text>
              <Text style={[typography.labelSm, { color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' }]} numberOfLines={1}>
                {friend.genres.join(' • ')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
      <MadeInIndiaFooter />
    </ScrollView>
  );

  /* ──────────── LOADING PHASE ──────────── */
  const renderLoadingPhase = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.blendingAvatars}>
        <View style={[styles.blendAvatar, { backgroundColor: colors.surfaceContainerHighest }]}>
          <Text style={{ fontSize: 32 }}>🎧</Text>
        </View>
        <View style={styles.blendConnector}>
          <MaterialIcon name="compare-arrows" size={24} color={colors.primary} />
        </View>
        <View style={[styles.blendAvatar, { backgroundColor: colors.surfaceContainerHighest }]}>
          <Text style={{ fontSize: 32 }}>{selectedFriend?.avatar}</Text>
        </View>
      </View>
      <Text style={[typography.titleLg, { color: colors.onSurface, fontWeight: '700', marginTop: 24 }]}>
        Blending tastes...
      </Text>
      <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
        Mixing your vibe with {selectedFriend?.name}
      </Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
    </View>
  );

  /* ──────────── RESULT PHASE ──────────── */
  const renderResultPhase = () => (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <FlatList
        data={blendTracks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListFooterComponent={<MadeInIndiaFooter />}
        ListHeaderComponent={
          <View style={styles.resultHeader}>
            {/* Blend hero */}
            <LinearGradient
              colors={selectedFriend?.gradient || ['#333', '#111']}
              style={styles.resultHero}
            >
              <View style={styles.blendingAvatars}>
                <View style={styles.blendAvatarLg}>
                  <Text style={{ fontSize: 40 }}>🎧</Text>
                </View>
                <View style={[styles.blendConnector, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <MaterialIcon name="favorite" size={20} color="#fff" />
                </View>
                <View style={styles.blendAvatarLg}>
                  <Text style={{ fontSize: 40 }}>{selectedFriend?.avatar}</Text>
                </View>
              </View>

              <Text style={[typography.headlineMd, { color: '#fff', fontWeight: '800', marginTop: 16 }]}>
                You & {selectedFriend?.name}
              </Text>

              <TasteRing
                percentage={tasteMatch}
                size={130}
                color={selectedFriend?.gradient[0] || colors.primary}
              />

              <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.7)', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }]}>
                {tasteMatch >= 80
                  ? 'You two are musical soulmates! 🎶'
                  : tasteMatch >= 60
                  ? 'Great overlap — lots of common ground!'
                  : tasteMatch >= 40
                  ? 'Different vibes, but that makes the blend interesting!'
                  : 'Opposites attract — expect some surprises!'}
              </Text>
            </LinearGradient>

            {/* Play all / shuffle */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.playAllBtn}
                onPress={() => {
                  if (blendTracks.length > 0) {
                    play(blendTracks[0], blendTracks);
                    navigation.navigate('Player');
                  }
                }}
              >
                <MaterialIcon name="play-arrow" size={22} color="#FFFFFF" />
                <Text style={[typography.titleSm, { color: '#FFFFFF', fontWeight: '700', marginLeft: 6 }]}>Play Blend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shuffleBtn}
                onPress={() => {
                  if (blendTracks.length > 0) {
                    const shuffled = [...blendTracks].sort(() => Math.random() - 0.5);
                    play(shuffled[0], shuffled);
                    navigation.navigate('Player');
                  }
                }}
              >
                <MaterialIcon name="shuffle" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.titleMd, { color: colors.onSurface, fontWeight: '700', marginHorizontal: spacing.xl, marginBottom: 12 }]}>
              Blend Playlist • {blendTracks.length} songs
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.trackRow}
            activeOpacity={0.7}
            onPress={() => {
              play(item, blendTracks);
              navigation.navigate('Player');
            }}
          >
            <Text style={styles.trackIndex}>{index + 1}</Text>
            <Image source={{ uri: item.artwork }} style={styles.trackArt} />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                play(item, blendTracks);
                navigation.navigate('Player');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcon name="play-circle-outline" size={26} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[typography.titleLg, { color: colors.onSurface, fontWeight: '700', flex: 1, textAlign: 'center' }]}>
          {phase === 'pick' ? 'Duo Blend' : phase === 'loading' ? 'Blending...' : `Blend: ${selectedFriend?.name}`}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {phase === 'pick' && renderPickPhase()}
      {phase === 'loading' && renderLoadingPhase()}
      {phase === 'result' && renderResultPhase()}
    </View>
  );
}

/* ──────────── STYLES ──────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 12,
  },

  /* Taste Card */
  tasteCard: {
    marginHorizontal: spacing.xl,
    marginTop: 16,
    borderRadius: radii.lg,
    padding: 20,
  },
  tasteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tasteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topArtistsRow: {
    marginTop: 16,
  },
  artistChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.glassAlpha10,
    borderWidth: 1,
    borderColor: colors.glassAlpha20,
  },

  /* Friend Grid */
  friendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  friendCard: {
    width: (SCREEN_W - spacing.xl * 2 - 12) / 2,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  friendGradient: {
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blendingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blendAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blendAvatarLg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blendConnector: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Result */
  resultHeader: {},
  resultHero: {
    marginHorizontal: spacing.xl,
    marginTop: 8,
    borderRadius: radii.lg,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radii.full,
  },
  shuffleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glassAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassAlpha20,
  },

  /* Track list */
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
  },
  trackIndex: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    width: 24,
    textAlign: 'center',
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    marginLeft: 8,
    backgroundColor: colors.surfaceContainer,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  trackArtist: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});
