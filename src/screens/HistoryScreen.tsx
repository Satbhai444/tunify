import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore, usePlayerStore, useSettingsStore } from '../stores';
import { Track } from '../types';

export function HistoryScreen({ navigation }: any) {
   const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const clearRecentlyPlayed = useLibraryStore((s) => s.clearRecentlyPlayed);
  const play = usePlayerStore((s) => s.play);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  const handleClear = () => {
    Alert.alert('Clear History', 'Remove all recently played songs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearRecentlyPlayed() },
    ]);
  };

  const renderTrack = ({ item, index }: { item: Track; index: number }) => {
    const isActive = currentTrackId === item.id;
    return (
      <TouchableOpacity
        style={styles.trackRow}
        onPress={() => {
          play(item, recentlyPlayed);
          navigation.navigate('Player');
        }}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.artwork }} style={styles.trackArt} />
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.trackArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            play(item, recentlyPlayed);
            navigation.navigate('Player');
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcon name={isActive ? "equalizer" : "play-circle-outline"} size={28} color={theme.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient 
        colors={themeMode === 'dark' ? ['#4F39CC', theme.background] : ['#A5B4FC', theme.background]} 
        style={StyleSheet.absoluteFill} 
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
          }
          hitSlop={{ top: 10, bottom: 10 }}
        >
          <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>History</Text>
        {recentlyPlayed.length > 0 ? (
          <TouchableOpacity 
            onPress={handleClear}
            style={[styles.clearBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,113,81,0.1)' : 'rgba(239, 68, 68, 0.1)' }]}
          >
            <MaterialIcon name="delete-outline" size={22} color={theme.error} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {recentlyPlayed.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.primary + '15' }]}>
            <MaterialIcon name="history" size={72} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>No history yet</Text>
          <Text style={[styles.emptyHint, { color: theme.onSurfaceVariant }]}>Songs you listen to will appear here for quick access.</Text>
          <TouchableOpacity 
            style={[styles.emptyBtn, { backgroundColor: theme.primary }]} 
            onPress={() => navigation.navigate('Main')}
          >
            <MaterialIcon name="play-arrow" size={20} color="#FFF" />
            <Text style={styles.emptyBtnText}>Discover Music</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentlyPlayed}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          renderItem={renderTrack}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.onSurfaceVariant }]}>{recentlyPlayed.length} songs recently played</Text>
              <TouchableOpacity
                onPress={() => {
                  if (recentlyPlayed.length > 0) {
                    play(recentlyPlayed[0], recentlyPlayed);
                    navigation.navigate('Player');
                  }
                }}
                style={[styles.playAllBtn, { backgroundColor: theme.primary }]}
              >
                <MaterialIcon name="shuffle" size={18} color="#FFF" />
                <Text style={styles.playAllText}>Shuffle All</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={<MadeInIndiaFooter />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...typography.titleLg, fontWeight: '800' },
  clearBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: 20,
    marginTop: 8,
  },
  statsText: { ...typography.bodySm },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 4,
  },
  playAllText: { ...typography.labelMd, color: '#FFF', fontWeight: '700' },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    gap: 16,
  },
  trackArt: { width: 56, height: 56, borderRadius: radii.md },
  trackInfo: { flex: 1 },
  trackTitle: { ...typography.titleSm, fontWeight: '700' },
  trackArtist: { ...typography.bodySm, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 },
  emptyIconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { ...typography.titleLg, fontWeight: '800', textAlign: 'center' },
  emptyHint: { ...typography.bodyMd, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, gap: 8, marginTop: 8 },
  emptyBtnText: { ...typography.titleSm, color: '#FFF', fontWeight: '700' },
});
