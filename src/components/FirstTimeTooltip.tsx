import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from './MaterialIcon';
import { MaterialIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TOOLTIP_KEY = 'tunify_tooltips_seen';

interface TooltipConfig {
  id: string;
  icon: string;
  title: string;
  message: string;
}

const TOOLTIPS: Record<string, TooltipConfig[]> = {
  home: [
    { id: 'home_longpress', icon: 'touch-app', title: 'Quick Actions', message: 'Long press any song for more options like Share, Add to Queue & more' },
    { id: 'home_pullrefresh', icon: 'refresh', title: 'Pull to Refresh', message: 'Swipe down to refresh and discover new music recommendations' },
  ],
  player: [
    { id: 'player_lyrics', icon: 'lyrics', title: 'Sing Along', message: 'Tap the lyrics icon to see real-time synced lyrics while playing' },
    { id: 'player_queue', icon: 'queue-music', title: 'Queue', message: 'Manage your upcoming songs by tapping the queue icon' },
  ],
  library: [
    { id: 'library_liked', icon: 'favorite', title: 'Your Collection', message: 'Tap the heart icon on any song to save it to your Liked Songs' },
  ],
};

interface FirstTimeTooltipProps {
  screen: 'home' | 'player' | 'library';
}

export function FirstTimeTooltip({ screen }: FirstTimeTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<TooltipConfig | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    checkAndShowTooltip();
  }, []);

  async function checkAndShowTooltip() {
    try {
      const raw = await AsyncStorage.getItem(TOOLTIP_KEY);
      const seen: string[] = raw ? JSON.parse(raw) : [];
      const tips = TOOLTIPS[screen] || [];
      const unseen = tips.filter((t) => !seen.includes(t.id));
      if (unseen.length > 0) {
        setCurrentTip(unseen[0]);
        setTipIndex(0);
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      }
    } catch {}
  }

  async function dismiss() {
    if (!currentTip) return;
    // Mark as seen
    const raw = await AsyncStorage.getItem(TOOLTIP_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    seen.push(currentTip.id);
    await AsyncStorage.setItem(TOOLTIP_KEY, JSON.stringify(seen));

    // Check for next tip
    const tips = TOOLTIPS[screen] || [];
    const unseen = tips.filter((t) => !seen.includes(t.id));
    if (unseen.length > 0) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setCurrentTip(unseen[0]);
      setTipIndex((i) => i + 1);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setVisible(false);
      });
    }
  }

  if (!visible || !currentTip) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.iconWrap}>
          <MaterialIcon name={currentTip.icon as IconName} size={28} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{currentTip.title}</Text>
          <Text style={styles.message}>{currentTip.message}</Text>
        </View>
        <TouchableOpacity style={styles.gotItBtn} onPress={dismiss}>
          <Text style={styles.gotItText}>Got it</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  card: {
    backgroundColor: colors.surfaceContainerHigh || '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  message: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  gotItBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  gotItText: {
    ...typography.titleSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
