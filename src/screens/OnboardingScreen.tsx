import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useSettingsStore } from '../stores/settingsStore';

const { width: SCREEN_W } = Dimensions.get('window');
const ONBOARDING_KEY = 'tunify_onboarding_done';

const GENRE_OPTIONS = [
  { name: 'Bollywood', icon: 'movie', gradient: ['#dc2626', '#9a3412'] as [string, string] },
  { name: 'Pop', icon: 'music-note', gradient: ['#ec4899', '#be123c'] as [string, string] },
  { name: 'Hip-Hop', icon: 'headphones', gradient: ['#f97316', '#b45309'] as [string, string] },
  { name: 'Rock', icon: 'whatshot', gradient: ['#9333ea', '#312e81'] as [string, string] },
  { name: 'Indie', icon: 'piano', gradient: ['#14b8a6', '#065f46'] as [string, string] },
  { name: 'EDM', icon: 'equalizer', gradient: ['#10b981', '#047857'] as [string, string] },
  { name: 'Punjabi', icon: 'audiotrack', gradient: ['#f59e0b', '#d97706'] as [string, string] },
  { name: 'K-Pop', icon: 'star', gradient: ['#06b6d4', '#0e7490'] as [string, string] },
  { name: 'Lo-Fi', icon: 'headset', gradient: ['#6366f1', '#4338ca'] as [string, string] },
  { name: 'Romance', icon: 'favorite', gradient: ['#c026d3', '#831843'] as [string, string] },
  { name: 'Classical', icon: 'library-music', gradient: ['#78716c', '#44403c'] as [string, string] },
  { name: 'Party', icon: 'celebration', gradient: ['#f43f5e', '#e11d48'] as [string, string] },
  { name: 'Chill', icon: 'spa', gradient: ['#3b82f6', '#155e75'] as [string, string] },
  { name: 'Ghazals', icon: 'mic', gradient: ['#a78bfa', '#7c3aed'] as [string, string] },
  { name: 'Workout', icon: 'fitness-center', gradient: ['#84cc16', '#15803d'] as [string, string] },
  { name: 'Devotional', icon: 'self-improvement', gradient: ['#fbbf24', '#b45309'] as [string, string] },
];

const ARTIST_OPTIONS = [
  'Arijit Singh', 'Taylor Swift', 'Diljit Dosanjh', 'Drake',
  'AP Dhillon', 'Shreya Ghoshal', 'The Weeknd', 'Pritam',
  'Bad Bunny', 'Neha Kakkar', 'Ed Sheeran', 'Billie Eilish',
  'Jubin Nautiyal', 'BTS', 'Atif Aslam', 'Dua Lipa',
  'A.R. Rahman', 'Post Malone', 'Lata Mangeshkar', 'Travis Scott',
];

export function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState<'name' | 'genres' | 'artists'>('name');
  const [userName, setUserName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  const toggleArtist = (artist: string) => {
    setSelectedArtists((prev) => {
      const next = new Set(prev);
      if (next.has(artist)) next.delete(artist);
      else next.add(artist);
      return next;
    });
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      await AsyncStorage.setItem(
        'tunify_preferences',
        JSON.stringify({
          genres: Array.from(selectedGenres),
          artists: Array.from(selectedArtists),
        }),
      );
      // Save user name
      if (userName.trim()) {
        useSettingsStore.getState().setUserName(userName.trim());
      }
      // Request notification permission on Android 13+
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const { PermissionsAndroid } = require('react-native');
          await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
        } catch {}
      }
    } catch {}
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#0e0e0e']} style={StyleSheet.absoluteFill} />

      {step === 'name' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.stepTag}>Step 1 of 3</Text>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>This helps us personalize your experience</Text>
          </View>

          <View style={styles.nameContainer}>
            <View style={styles.nameIconContainer}>
              <MaterialIcon name="person" size={48} color={colors.primary} />
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor={colors.outlineVariant}
              value={userName}
              onChangeText={setUserName}
              maxLength={25}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => {
                if (userName.trim().length >= 2) setStep('genres');
              }}
            />
            <Text style={styles.nameHint}>
              {userName.trim().length > 0
                ? `Hey ${userName.trim()}! 👋`
                : 'Minimum 2 characters'}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, userName.trim().length < 2 && styles.nextBtnDisabled]}
              onPress={() => setStep('genres')}
              disabled={userName.trim().length < 2}
            >
              <Text style={[styles.nextBtnText, userName.trim().length < 2 && { opacity: 0.5 }]}>
                Next
              </Text>
              <MaterialIcon name="arrow-forward" size={20} color={userName.trim().length < 2 ? colors.onSurfaceVariant : colors.background} />
            </TouchableOpacity>
          </View>
        </>
      ) : step === 'genres' ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('name')} style={{ marginBottom: 8 }}>
              <MaterialIcon name="arrow-back" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <Text style={styles.stepTag}>Step 2 of 3</Text>
            <Text style={styles.title}>What do you like to listen to?</Text>
            <Text style={styles.subtitle}>Pick at least 3 genres to get personalized recommendations</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {GENRE_OPTIONS.map((genre) => {
              const selected = selectedGenres.has(genre.name);
              return (
                <TouchableOpacity
                  key={genre.name}
                  onPress={() => toggleGenre(genre.name)}
                  activeOpacity={0.8}
                  style={styles.genreCardWrapper}
                >
                  <LinearGradient
                    colors={genre.gradient}
                    style={[styles.genreCard, selected && styles.genreCardSelected]}
                  >
                    {selected && (
                      <View style={styles.checkBadge}>
                        <MaterialIcon name="check" size={16} color={colors.background} />
                      </View>
                    )}
                    <MaterialIcon
                      name={genre.icon as any}
                      size={24}
                      color={selected ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.genreName, selected && { color: '#ffffff' }]}>{genre.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, selectedGenres.size < 3 && styles.nextBtnDisabled]}
              onPress={() => setStep('artists')}
              disabled={selectedGenres.size < 3}
            >
              <Text style={[styles.nextBtnText, selectedGenres.size < 3 && { opacity: 0.5 }]}>
                Next ({selectedGenres.size}/3+)
              </Text>
              <MaterialIcon name="arrow-forward" size={20} color={selectedGenres.size < 3 ? colors.onSurfaceVariant : colors.background} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('genres')} style={{ marginBottom: 8 }}>
              <MaterialIcon name="arrow-back" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <Text style={styles.stepTag}>Step 3 of 3</Text>
            <Text style={styles.title}>Pick your favorite artists</Text>
            <Text style={styles.subtitle}>Select at least 3 artists you love</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.artistGrid}
            showsVerticalScrollIndicator={false}
          >
            {ARTIST_OPTIONS.map((artist) => {
              const selected = selectedArtists.has(artist);
              return (
                <TouchableOpacity
                  key={artist}
                  onPress={() => toggleArtist(artist)}
                  activeOpacity={0.7}
                  style={[styles.artistChip, selected && styles.artistChipSelected]}
                >
                  {selected && <MaterialIcon name="check" size={16} color={colors.background} />}
                  <Text style={[styles.artistChipText, selected && styles.artistChipTextSelected]}>
                    {artist}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, selectedArtists.size < 3 && styles.nextBtnDisabled]}
              onPress={handleFinish}
              disabled={selectedArtists.size < 3}
            >
              <Text style={[styles.nextBtnText, selectedArtists.size < 3 && { opacity: 0.5 }]}>
                Let's Go! ({selectedArtists.size}/3+)
              </Text>
              <MaterialIcon name="celebration" size={20} color={selectedArtists.size < 3 ? colors.onSurfaceVariant : colors.background} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// Export helper to check if onboarding is done
export async function isOnboardingDone(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
    paddingBottom: 16,
  },
  stepTag: {
    ...typography.labelSm,
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  nameContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
    alignItems: 'center',
  },
  nameIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(114, 254, 143, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(114, 254, 143, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  nameInput: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(114, 254, 143, 0.2)',
  },
  nameHint: {
    ...typography.bodyMd,
    color: colors.primary,
    marginTop: 16,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl - 4,
    paddingBottom: 100,
    gap: 10,
  },
  genreCardWrapper: {
    width: (SCREEN_W - spacing.xl * 2 - 10) / 2,
  },
  genreCard: {
    height: 80,
    borderRadius: radii.md,
    padding: 14,
    justifyContent: 'space-between',
    opacity: 0.6,
  },
  genreCardSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreName: {
    ...typography.titleSm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
    gap: 10,
  },
  artistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  artistChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  artistChipText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  artistChipTextSelected: {
    color: colors.background,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 20,
    paddingBottom: 36,
    backgroundColor: 'rgba(14,14,14,0.95)',
  },
  skipText: {
    ...typography.titleSm,
    color: colors.onSurfaceVariant,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  nextBtnDisabled: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  nextBtnText: {
    ...typography.titleSm,
    color: colors.background,
    fontWeight: '700',
  },
});
