import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';
import { setPreferredQuality } from '../api/musicService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const QUALITY_KBPS: Record<string, string> = { low: '96kbps', normal: '160kbps', high: '320kbps' };

const LOADING_STEPS = ['Initializing...', 'Checking Library...', 'Waking Engines...', 'Almost there...'];
const BRAND_CHARS = 'tunify'.split('');

export function SplashScreen({ navigation }: any) {
  // --- Background Aura Animations ---
  const blob1Pos = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;
  const blob2Pos = useRef(new Animated.ValueXY({ x: SCREEN_W, y: SCREEN_H / 2 })).current;
  const blob3Pos = useRef(new Animated.ValueXY({ x: SCREEN_W / 2, y: SCREEN_H })).current;

  // --- Centerpiece Animations ---
  const visualizerOpacity = useRef(new Animated.Value(0)).current;
  const barAnims = [
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.9)).current,
    useRef(new Animated.Value(0.6)).current,
  ];

  // --- Text Animations ---
  const charAnims = useRef(BRAND_CHARS.map(() => new Animated.Value(0))).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  
  // --- Progress & Step State ---
  const [loadingStep, setLoadingStep] = React.useState(0);
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Start Aura Floating Animations
    const createBlobAnimation = (anim: Animated.ValueXY, to: { x: number, y: number }, duration: number) => {
      const from = { x: (anim.x as any)._value, y: (anim.y as any)._value };
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };

    createBlobAnimation(blob1Pos, { x: 100, y: 150 }, 8000);
    createBlobAnimation(blob2Pos, { x: 50, y: SCREEN_H / 3 }, 10000);
    createBlobAnimation(blob3Pos, { x: SCREEN_W - 100, y: SCREEN_H - 200 }, 9000);

    // 2. Start Visualizer Pulsing
    barAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400 + (i * 100), easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.3, duration: 400 + (i * 100), easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      ).start();
    });

    // 3. Sequential Intro Animation
    Animated.sequence([
      Animated.delay(300),
      // Fade in Visualizer
      Animated.timing(visualizerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      // Staggered letters
      Animated.stagger(100, charAnims.map(anim => 
        Animated.spring(anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
      )),
      // Fade in footer
      Animated.timing(footerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // 4. Progress Loading
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // 5. Loading step updates
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 800);

    // 6. Navigation
    const navTimer = setTimeout(async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('tunify_onboarding_done');
        const target = onboardingDone === 'true' ? 'Main' : 'Welcome';
        navigation.reset({ index: 0, routes: [{ name: target }] });
      } catch (e) {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    }, 4000);

    // 7. Background Data Loading
    useLibraryStore.getState().loadLibrary().catch(() => {});
    useSettingsStore.getState().loadSettings().then(() => {
      const q = useSettingsStore.getState().audioQuality;
      setPreferredQuality(QUALITY_KBPS[q] || '160kbps');
    }).catch(() => {});

    return () => {
      clearInterval(stepInterval);
      clearTimeout(navTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Dynamic Background Aura */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#050505', '#0e0e0e']} style={StyleSheet.absoluteFill} />
        
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(124, 58, 237, 0.15)', transform: blob1Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(114, 254, 143, 0.08)', width: 400, height: 400, transform: blob2Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(79, 57, 204, 0.12)', width: 250, height: 250, transform: blob3Pos.getTranslateTransform() }]} />
      </View>

      <View style={styles.content}>
        {/* Animated Visualizer Centerpiece */}
        <Animated.View style={[styles.centerpiece, { opacity: visualizerOpacity }]}>
          <View style={styles.visualizer}>
            {barAnims.map((anim, i) => (
              <Animated.View 
                key={i} 
                style={[
                  styles.bar, 
                  { 
                    height: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 50] }),
                    backgroundColor: i === 2 ? colors.primary : colors.primary + '88'
                  }
                ]} 
              />
            ))}
          </View>
          <View style={styles.logoBase}>
             <MaterialIcon name="music-note" size={60} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Staggered Brand Text */}
        <View style={styles.brandContainer}>
          {BRAND_CHARS.map((char, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.brandChar,
                {
                  opacity: charAnims[i],
                  transform: [
                    { translateY: charAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                    { scale: charAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }
                  ]
                }
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text style={[styles.tagline, { opacity: charAnims[5] }]}>
          PREMIUM MUSIC PLAYER
        </Animated.Text>
      </View>

      {/* Modern Progress Indicator */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.loadingText}>{LOADING_STEPS[loadingStep]}</Text>
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
              }
            ]} 
          >
            <LinearGradient 
              colors={[colors.primary + '44', colors.primary]} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 0}} 
              style={StyleSheet.absoluteFill} 
            />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 200,
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  centerpiece: {
    height: 180,
    width: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 60,
    position: 'absolute',
    top: 20,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  logoBase: {
    marginTop: 40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
  },
  brandChar: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginHorizontal: 1,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
    marginTop: 10,
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    width: '60%',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});
