import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { darkColors, lightColors, typography } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { usePlayerStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';

const BAR_COUNT = 4;

function WaveformBars({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3)),
  ).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const animations = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.6 + Math.random() * 0.4,
              duration: 300 + i * 80,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.2 + Math.random() * 0.2,
              duration: 250 + i * 60,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ),
      );
      animRef.current = Animated.parallel(animations);
      animRef.current.start();
    } else {
      animRef.current?.stop();
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
    return () => {
      animRef.current?.stop();
    };
  }, [isPlaying]);

  return (
    <View style={waveStyles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            { backgroundColor: color, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 18,
    marginRight: 4,
  },
  bar: {
    width: 3,
    height: 18,
    borderRadius: 1.5,
  },
});

export function MiniPlayer({ onPress }: { onPress: () => void }) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const skipNext = usePlayerStore((s) => s.skipNext);

  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.outline,
          shadowColor: themeMode === 'dark' ? '#000' : '#B8A990',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={[styles.progressBar, { backgroundColor: theme.surfaceContainer }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          <Image
            source={{ uri: currentTrack.artwork }}
            style={styles.artwork}
            contentFit="cover"
            transition={200}
          />
        </View>
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isPlaying && <WaveformBars isPlaying={isPlaying} color={theme.primary} />}
            <Text style={[styles.title, { color: theme.onSurface, flex: 1 }]} numberOfLines={1}>
              {String(currentTrack.title)}
            </Text>
          </View>
          <Text style={[styles.artist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
            {String(currentTrack.artist)}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              togglePlayPause();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isBuffering ? (
              <ActivityIndicator size={24} color={theme.onSurface} />
            ) : (
              <MaterialIcon
                name={isPlaying ? 'pause' : 'play-arrow'}
                size={30}
                color={theme.onSurface}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              skipNext();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcon name="skip-next" size={26} color={theme.onSurface} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  progressBar: {
    height: 2.5,
  },
  progressFill: {
    height: 2.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  artworkContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.titleSm,
    fontWeight: '700',
  },
  artist: {
    ...typography.bodySm,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
