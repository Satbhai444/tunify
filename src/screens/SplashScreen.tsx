import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';
import { setPreferredQuality } from '../api/musicService';

const { width: SCREEN_W } = Dimensions.get('window');
const QUALITY_KBPS: Record<string, string> = { low: '96kbps', normal: '160kbps', high: '320kbps' };

const LOADING_STEPS = ['Loading library...', 'Setting up audio...', 'Almost ready...', 'Welcome!'];

export function SplashScreen({ navigation }: any) {
  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const noteRotate = useRef(new Animated.Value(0)).current;

  const [loadingStep, setLoadingStep] = React.useState(0);

  useEffect(() => {
    // Step 1: Glow fades in
    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: 0.25,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(glowScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Logo bounces in (200ms delay)
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Small note rotation
        Animated.sequence([
          Animated.timing(noteRotate, {
            toValue: -0.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(noteRotate, {
            toValue: 0,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Step 3: Title slides up + fades in (500ms delay)
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Step 4: Subtitle fades in (800ms delay)
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 5: Progress bar appears + fills (1000ms delay)
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
    ]).start();

    // Pulse glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Loading step updates
    const stepTimers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setLoadingStep(i), 1100 + i * 600),
    );

    // Navigate after splash
    const navTimer = setTimeout(async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('tunify_onboarding_done');
        const target = onboardingDone === 'true' ? 'Main' : 'Onboarding';
        navigation.reset({ index: 0, routes: [{ name: target }] });
      } catch (e) {
        console.error('Navigation error:', e);
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    }, 3200);

    // Load library + settings in background
    useLibraryStore.getState().loadLibrary().catch(() => {});
    useSettingsStore
      .getState()
      .loadSettings()
      .then(() => {
        const q = useSettingsStore.getState().audioQuality;
        setPreferredQuality(QUALITY_KBPS[q] || '160kbps');
      })
      .catch(() => {});

    return () => {
      clearTimeout(navTimer);
      stepTimers.forEach(clearTimeout);
    };
  }, [navigation]);

  const noteRotateInterp = noteRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#0e0e0e', '#111211']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.glowOuter,
          {
            opacity: glowOpacity,
            transform: [{ scale: Animated.multiply(glowScale, pulseAnim) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowInner,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Ring around logo */}
        <View style={styles.logoRing}>
          <View style={styles.logoInner}>
            <Animated.View style={{ transform: [{ rotate: noteRotateInterp }] }}>
              <MaterialIcon name="music-note" size={52} color={colors.primary} />
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* Brand Name */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        Tunify
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        YOUR MUSIC, YOUR VIBE
      </Animated.Text>

      {/* Progress Section */}
      <Animated.View style={[styles.loadingContainer, { opacity: progressOpacity }]}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          {/* Glow on progress tip */}
          <Animated.View
            style={[
              styles.progressGlow,
              {
                left: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '95%'],
                }),
              },
            ]}
          />
        </View>

        <Animated.Text style={[styles.loadingText, { opacity: progressOpacity }]}>
          {LOADING_STEPS[loadingStep]}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(114, 254, 143, 0.08)',
  },
  glowInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(114, 254, 143, 0.12)',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(114, 254, 143, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(114, 254, 143, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(114, 254, 143, 0.15)',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 5,
    opacity: 0.8,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 90,
    alignItems: 'center',
    width: '65%',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressGlow: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(114, 254, 143, 0.4)',
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 14,
    letterSpacing: 0.5,
  },
});
