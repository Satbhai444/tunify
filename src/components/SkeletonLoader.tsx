import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={[styles.skeleton, { width, height, borderRadius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function TrackItemSkeleton() {
  return (
    <View style={styles.trackRow}>
      <Skeleton width={56} height={56} borderRadius={16} />
      <View style={styles.trackInfo}>
        <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <View style={styles.playlistCard}>
      <Skeleton width={260} height={320} borderRadius={32} />
    </View>
  );
}

export function MixCardSkeleton() {
  return (
    <View style={styles.mixCard}>
      <Skeleton width={160} height={160} borderRadius={28} />
      <Skeleton width={120} height={18} borderRadius={4} style={{ marginTop: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
  },
  trackInfo: {
    flex: 1,
  },
  playlistCard: {
    width: 260,
    height: 320,
    marginRight: 16,
  },
  mixCard: {
    width: 160,
    marginRight: 16,
  },
});
