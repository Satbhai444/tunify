import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkColors, lightColors, typography, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useSettingsStore } from '../stores';

const STEPS = [
  {
    title: 'Search & Discover',
    description: 'Find your favorite tracks, artists, and albums using the Search tab. You can also explore trending music in the Discover section.',
    icon: 'search',
    color: ['#7B61FF', '#4F39CC'] as [string, string],
  },
  {
    title: 'High Quality Playback',
    description: 'Tap on any song to start playing. Use the Player screen to enjoy high-quality audio with smooth transitions.',
    icon: 'play-circle-filled',
    color: ['#FF6B6B', '#EE5A24'] as [string, string],
  },
  {
    title: 'Personalized Equalizer',
    description: 'Head to Settings > Audio to customize your sound. Choose from Bass Boost, Vocal Clarity, and more.',
    icon: 'graphic-eq',
    color: ['#00C9FF', '#92FE9D'] as [string, string],
  },
  {
    title: 'Offline Downloads',
    description: 'Save songs for offline listening. Just tap the download icon on any song or album to save it to your library.',
    icon: 'file-download',
    color: ['#F97316', '#B45309'] as [string, string],
  },
  {
    title: 'Custom Profile',
    description: 'Personalize your experience by setting up your profile, choosing a cool avatar, and managing your preferences in Settings.',
    icon: 'account-circle',
    color: ['#EC4899', '#BE185D'] as [string, string],
  },
];

export function HowToUseScreen({ navigation }: any) {
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={themeMode === 'dark' ? ['#4F39CC', '#0D0D1F'] : ['#E0E7FF', '#F8F9FE']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>How to Use Tunify</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.introText, { color: theme.onSurfaceVariant }]}>
          Getting started with Tunify is easy. Follow these simple steps to make the most of your premium music experience.
        </Text>

        {STEPS.map((step, idx) => (
          <View key={idx} style={[styles.stepCard, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <LinearGradient colors={step.color} style={styles.iconCircle}>
              <MaterialIcon name={step.icon as any} size={28} color="#FFF" />
            </LinearGradient>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, { color: theme.onSurface }]}>{idx + 1}. {step.title}</Text>
              <Text style={[styles.stepDescription, { color: theme.onSurfaceVariant }]}>{step.description}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.tipBox, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
            <MaterialIcon name="lightbulb" size={24} color={theme.primary} />
            <Text style={[styles.tipText, { color: theme.onSurface }]}>
                <Text style={{ fontWeight: '800' }}>Pro Tip:</Text> Double tap on the mini-player to quickly open the full player screen!
            </Text>
        </View>

        <TouchableOpacity 
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneText}>Got it, Let's Rock! 🎸</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  headerTitle: { ...typography.headlineSm, marginLeft: 16, fontWeight: '800' },
  content: { padding: 20 },
  introText: { ...typography.bodyLarge, marginBottom: 24, lineHeight: 24 },
  stepCard: { flexDirection: 'row', padding: 20, borderRadius: 24, marginBottom: 16, borderWidth: 1, alignItems: 'center', gap: 20 },
  iconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepInfo: { flex: 1 },
  stepTitle: { ...typography.titleMedium, fontWeight: '800', marginBottom: 6 },
  stepDescription: { ...typography.bodyMedium, lineHeight: 20 },
  tipBox: { flexDirection: 'row', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1, marginTop: 10, alignItems: 'center' },
  tipText: { flex: 1, ...typography.bodyMedium, lineHeight: 22 },
  doneButton: { marginTop: 30, paddingVertical: 18, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  doneText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
