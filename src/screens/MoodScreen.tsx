import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { usePlayerStore } from '../stores';
import { searchSongs } from '../api/musicService';
import type { Track } from '../types/music';

const { width: SCREEN_W } = Dimensions.get('window');

/* ──────────── Mood definitions ──────────── */
interface MoodDef {
  id: string;
  name: string;
  emoji: string;
  gradient: [string, string];
  queries: string[];
  description: string;
}

const MOODS: MoodDef[] = [
  {
    id: 'happy', name: 'Happy', emoji: '😊',
    gradient: ['#fdcb6e', '#e17055'],
    queries: ['happy upbeat bollywood songs', 'feel good pop hits', 'happy dance party songs'],
    description: 'Upbeat tracks to boost your mood',
  },
  {
    id: 'sad', name: 'Sad', emoji: '😢',
    gradient: ['#636e72', '#2d3436'],
    queries: ['sad bollywood emotional songs', 'heartbreak sad songs hindi', 'melancholy piano songs'],
    description: 'Songs for when you need to feel',
  },
  {
    id: 'chill', name: 'Chill', emoji: '😌',
    gradient: ['#55efc4', '#00b894'],
    queries: ['chill lofi relaxing songs', 'chill vibes acoustic songs', 'calm ambient music'],
    description: 'Relax and unwind',
  },
  {
    id: 'energetic', name: 'Energetic', emoji: '⚡',
    gradient: ['#ff7675', '#d63031'],
    queries: ['energetic workout pump songs', 'high energy EDM dance', 'power rock anthems'],
    description: 'High energy bangers',
  },
  {
    id: 'romantic', name: 'Romantic', emoji: '❤️',
    gradient: ['#fd79a8', '#e84393'],
    queries: ['romantic love songs hindi', 'romantic duets bollywood', 'love ballads english'],
    description: 'Love is in the air',
  },
  {
    id: 'focus', name: 'Focus', emoji: '🎯',
    gradient: ['#a29bfe', '#6c5ce7'],
    queries: ['focus study instrumental music', 'concentration ambient sounds', 'deep focus piano music'],
    description: 'Deep work & study mode',
  },
  {
    id: 'party', name: 'Party', emoji: '🎉',
    gradient: ['#ffeaa7', '#fdcb6e'],
    queries: ['party dance bollywood songs', 'club party anthems', 'party celebration hits'],
    description: 'Get the party started',
  },
  {
    id: 'sleep', name: 'Sleep', emoji: '🌙',
    gradient: ['#2d3436', '#0a0a0a'],
    queries: ['sleep relaxing soft music', 'lullaby calm night songs', 'ambient sleep sounds'],
    description: 'Drift off peacefully',
  },
];

/* ──────────── MAIN SCREEN ──────────── */

export function MoodScreen({ navigation }: any) {
  const play = usePlayerStore((s) => s.play);

  const [selectedMood, setSelectedMood] = useState<MoodDef | null>(null);
  const [moodTracks, setMoodTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const selectMood = async (mood: MoodDef) => {
    setSelectedMood(mood);
    setLoading(true);
    setMoodTracks([]);

    try {
      const results = await Promise.all(
        mood.queries.map((q) => searchSongs(q).catch(() => [] as Track[])),
      );

      const seenIds = new Set<string>();
      const allTracks: Track[] = [];
      results.forEach((tracks) => {
        tracks.forEach((t) => {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            allTracks.push(t);
          }
        });
      });

      // Shuffle
      for (let i = allTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
      }

      setMoodTracks(allTracks.slice(0, 30));
    } catch {
      setMoodTracks([]);
    }

    setLoading(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const [query, setQuery] = useState('');

  const handleAIQuery = async (text: string) => {
    if (!text.trim()) return;
    setQuery(text);
    setLoading(true);
    setSelectedMood({
      id: 'custom', name: 'Custom Mood', emoji: '✨',
      gradient: ['#7B61FF', '#4F39CC'],
      queries: [text],
      description: `Results for "${text}"`
    });
    
    try {
      const results = await searchSongs(text);
      setMoodTracks(results.slice(0, 30));
    } catch {
      setMoodTracks([]);
    }
    setLoading(false);
  };

  const goBack = () => {
    if (selectedMood) {
      setSelectedMood(null);
      setMoodTracks([]);
    } else {
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
           <MaterialIcon name="auto-awesome" size={20} color={colors.primary} />
           <TextInput
             style={styles.searchInput}
             placeholder="Midnight study vibe..."
             placeholderTextColor={colors.onSurfaceVariant}
             onSubmitEditing={(e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => handleAIQuery(e.nativeEvent.text)}
           />
        </View>
        <View style={{ width: 10 }} />
      </View>

      {!selectedMood ? (
        /* ═══════ MOOD GRID ═══════ */
        <FlatList
          data={MOODS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.moodGrid}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<MadeInIndiaFooter />}
          renderItem={({ item: mood }) => (
            <TouchableOpacity
              style={styles.moodCard}
              activeOpacity={0.7}
              onPress={() => selectMood(mood)}
            >
              <LinearGradient colors={mood.gradient} style={styles.moodGradient}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>{mood.emoji}</Text>
                <Text style={styles.moodName}>{mood.name}</Text>
                <Text style={styles.moodDesc}>{mood.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      ) : loading ? (
        /* ═══════ LOADING ═══════ */
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{selectedMood.emoji}</Text>
          <ActivityIndicator size="large" color={selectedMood.gradient[0]} />
          <Text style={[typography.titleMd, { color: colors.onSurface, marginTop: 16 }]}>
            Building your {selectedMood.name.toLowerCase()} playlist...
          </Text>
        </View>
      ) : (
        /* ═══════ RESULTS ═══════ */
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <FlatList
            data={moodTracks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListFooterComponent={<MadeInIndiaFooter />}
            ListHeaderComponent={
              <View>
                <LinearGradient colors={selectedMood.gradient} style={styles.resultHero}>
                  <Text style={{ fontSize: 56 }}>{selectedMood.emoji}</Text>
                  <Text style={[typography.headlineMd, { color: '#fff', fontWeight: '800', marginTop: 12 }]}>
                    {selectedMood.name} Vibes
                  </Text>
                  <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.7)', marginTop: 4 }]}>
                    {moodTracks.length} songs • {selectedMood.description}
                  </Text>
                </LinearGradient>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.playAllBtn}
                    onPress={() => {
                      if (moodTracks.length > 0) {
                        play(moodTracks[0], moodTracks);
                        navigation.navigate('Player');
                      }
                    }}
                  >
                    <MaterialIcon name="play-arrow" size={22} color="#FFFFFF" />
                    <Text style={[typography.titleSm, { color: "#FFFFFF", fontWeight: '700', marginLeft: 6 }]}>Play All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shuffleBtn}
                    onPress={() => {
                      if (moodTracks.length > 0) {
                        const shuffled = [...moodTracks].sort(() => Math.random() - 0.5);
                        play(shuffled[0], shuffled);
                        navigation.navigate('Player');
                      }
                    }}
                  >
                    <MaterialIcon name="shuffle" size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.trackRow}
                activeOpacity={0.7}
                onPress={() => {
                  play(item, moodTracks);
                  navigation.navigate('Player');
                }}
              >
                <Text style={styles.trackIdx}>{index + 1}</Text>
                <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    play(item, moodTracks);
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
      )}
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: 12, gap: 12
  },
  searchBar: {
    flex: 1, height: 44, borderRadius: radii.md, backgroundColor: colors.surfaceContainer,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10
  },
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
  headerTitle: { ...typography.titleLg, color: colors.onSurface, fontWeight: '700' },

  /* Mood Grid */
  moodGrid: { paddingHorizontal: spacing.xl, paddingTop: 8, paddingBottom: 120, gap: 12 },
  moodCard: { flex: 1, borderRadius: radii.lg, overflow: 'hidden' },
  moodGradient: { padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  moodName: { ...typography.titleMd, color: '#fff', fontWeight: '800' },
  moodDesc: { ...typography.labelSm, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Result */
  resultHero: {
    marginHorizontal: spacing.xl, marginTop: 8, borderRadius: radii.lg,
    paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center',
  },
  resultActions: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl,
    marginTop: 20, marginBottom: 16, gap: 12,
  },
  playAllBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, paddingVertical: 12, borderRadius: radii.full,
  },
  shuffleBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.glassAlpha10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassAlpha20,
  },

  /* Track list */
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: 8 },
  trackIdx: { ...typography.bodySm, color: colors.onSurfaceVariant, width: 24, textAlign: 'center' },
  trackArt: { width: 48, height: 48, borderRadius: radii.sm, marginLeft: 8, backgroundColor: colors.surfaceContainer },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  trackArtist: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
});
