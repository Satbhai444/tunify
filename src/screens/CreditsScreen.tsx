import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';

function safeGoBack(navigation: any) {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }
}

export function CreditsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(navigation)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Card */}
        <LinearGradient
          colors={['#1a3a2a', '#0e0e0e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarEmoji}>🚀</Text>
          </View>
          <Text style={styles.heroName}>Darshan Satbhai</Text>
          <Text style={styles.heroRole}>Creator & Developer</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🇮🇳 Made in India</Text>
          </View>
        </LinearGradient>

        {/* About the Creator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT THE CREATOR</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Tunify is designed and developed with passion by Darshan Satbhai. 
              Every screen, every animation, and every feature has been crafted 
              to deliver the best music experience possible.
            </Text>
          </View>
        </View>

        {/* What I Built */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT'S INSIDE TUNIFY</Text>
          {[
            { icon: 'music-note', label: 'Full Music Player', desc: 'Stream millions of songs with lyrics, EQ & crossfade' },
            { icon: 'explore', label: 'Smart Discovery', desc: 'AI-powered recommendations, Daily Mixes & Mood Playlists' },
            { icon: 'favorite', label: 'Personalized Library', desc: 'Liked songs, playlists, downloads & listening history' },
            { icon: 'people', label: 'Social Features', desc: 'Blend playlists, share songs & collaborative listening' },
            { icon: 'palette', label: 'Beautiful Design', desc: 'Material 3 dark theme with smooth animations' },
            { icon: 'devices', label: 'Cross-Platform', desc: 'Works on Android, iOS & Web' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialIcon name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureLabel}>{item.label}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tech Stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BUILT WITH</Text>
          <View style={styles.techGrid}>
            {['React Native', 'Expo SDK 54', 'TypeScript', 'Zustand', 'TrackPlayer', 'JioSaavn API'].map((tech, i) => (
              <View key={i} style={styles.techChip}>
                <Text style={styles.techChipText}>{tech}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP INFO</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Name</Text>
              <Text style={styles.infoValue}>Tunify</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.2.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Developer</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>Darshan Satbhai</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Country</Text>
              <Text style={styles.infoValue}>India 🇮🇳</Text>
            </View>
          </View>
        </View>

        {/* Special Thanks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPECIAL THANKS</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Thanks to the open-source community, the Expo team, and everyone 
              who inspired this project. Music connects us all. 🎵
            </Text>
          </View>
        </View>

        {/* Footer */}
        <MadeInIndiaFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '700',
  },
  heroCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radii.lg,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  heroName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroRole: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 16,
  },
  heroBadge: {
    backgroundColor: 'rgba(114, 254, 143, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(114, 254, 143, 0.3)',
  },
  heroBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xl,
    marginBottom: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    padding: 16,
  },
  cardText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(114, 254, 143, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureLabel: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  featureDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.xl,
    gap: 8,
  },
  techChip: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  techChipText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHighest,
  },
  infoLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  infoValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
});
