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
import { colors, typography, spacing, radii } from '../theme';
import { MadeInIndiaFooter } from '../components/MadeInIndiaFooter';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore, usePlayerStore } from '../stores';
import { Track } from '../types';

export function HistoryScreen({ navigation }: any) {
  const recentlyPlayed = useLibraryStore((s) => s.recentlyPlayed);
  const clearRecentlyPlayed = useLibraryStore((s) => s.clearRecentlyPlayed);
  const play = usePlayerStore((s) => s.play);

  const handleClear = () => {
    Alert.alert('Clear History', 'Remove all recently played songs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearRecentlyPlayed() },
    ]);
  };

  const renderTrack = ({ item, index }: { item: Track; index: number }) => (
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
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          play(item, recentlyPlayed);
          navigation.navigate('Player');
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcon name="play-circle-outline" size={28} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
          }
          hitSlop={{ top: 10, bottom: 10 }}
        >
          <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listening History</Text>
        {recentlyPlayed.length > 0 ? (
          <TouchableOpacity onPress={handleClear}>
            <MaterialIcon name="delete-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {recentlyPlayed.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcon name="history" size={64} color={colors.outlineVariant} />
          <Text style={styles.emptyText}>No listening history yet</Text>
          <Text style={styles.emptyHint}>Songs you play will appear here</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>{recentlyPlayed.length} songs played</Text>
            <TouchableOpacity
              onPress={() => {
                if (recentlyPlayed.length > 0) {
                  play(recentlyPlayed[0], recentlyPlayed);
                  navigation.navigate('Player');
                }
              }}
              style={styles.playAllBtn}
            >
              <MaterialIcon name="play-arrow" size={18} color={colors.background} />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentlyPlayed}
            keyExtractor={(item, i) => `${item.id}_${i}`}
            renderItem={renderTrack}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<MadeInIndiaFooter />}
          />
        </>
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: 12,
  },
  statsText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playAllText: {
    ...typography.labelMd,
    color: colors.background,
    fontWeight: '700',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    gap: 12,
  },
  trackArt: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  trackArtist: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
  },
  emptyHint: {
    ...typography.bodySm,
    color: colors.outlineVariant,
  },
});
