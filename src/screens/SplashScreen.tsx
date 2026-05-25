import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { colors } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore } from '../stores';
import { useSettingsStore } from '../stores/settingsStore';
import { auth } from '../services/firebaseConfig';
import { setPreferredQuality } from '../api/musicService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const QUALITY_KBPS: Record<string, string> = { low: '96kbps', normal: '160kbps', high: '320kbps' };

const LOADING_STEPS = ['Initializing...', 'Checking Network...', 'Checking Library...', 'Almost there...'];
const BRAND_CHARS = 'tunify'.split('');

export function SplashScreen({ navigation }: any) {
  const [isOffline, setIsOffline] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // --- Background Aura Animations ---
  const blob1Pos = useRef(new Animated.ValueXY({ x: -50, y: -50 })).current;
  const blob2Pos = useRef(new Animated.ValueXY({ x: SCREEN_W, y: SCREEN_H / 2 })).current;
  const blob3Pos = useRef(new Animated.ValueXY({ x: SCREEN_W / 2, y: SCREEN_H })).current;

  // --- Centerpiece Animations ---
  const visualizerOpacity = useRef(new Animated.Value(0)).current;
  const centerpieceScale = useRef(new Animated.Value(0.8)).current;
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
  const progressWidth = useRef(new Animated.Value(0)).current;

  const startAppLoading = () => {
    // 4. Progress Loading
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3000,
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
        const user = auth.currentUser;
        
        // Check network
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected || !networkState.isInternetReachable) {
          setIsOffline(true);
          return;
        }

        let target = 'Welcome';
        if (onboardingDone === 'true') {
          target = user ? 'Main' : 'Auth';
        }
        
        navigation.reset({ index: 0, routes: [{ name: target }] });
      } catch (e) {
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }
    }, 3500);

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
  };

  const handleNetworkCheck = async () => {
    setIsOffline(false);
    setLoadingStep(1);
    
    try {
      const state = await Network.getNetworkStateAsync();
      if (!state.isConnected || !state.isInternetReachable) {
        setIsOffline(true);
        return;
      }
      startAppLoading();
    } catch (e) {
      startAppLoading();
    }
  };

  useEffect(() => {
    // Start Aura Floating Animations
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

    // Start Visualizer Pulsing
    barAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400 + (i * 100), easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.3, duration: 400 + (i * 100), easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      ).start();
    });

    // Intro Animation Sequence
    Animated.parallel([
      Animated.timing(visualizerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(centerpieceScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(400),
        Animated.stagger(80, charAnims.map(anim => 
          Animated.spring(anim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
        )),
        Animated.timing(footerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ]).start();

    // Initial Network Check
    handleNetworkCheck();

  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Dynamic Background Aura */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#050505', '#0e0e0e', '#050505']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(124, 58, 237, 0.12)', transform: blob1Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(114, 254, 143, 0.06)', width: 400, height: 400, transform: blob2Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(79, 57, 204, 0.1)', width: 250, height: 250, transform: blob3Pos.getTranslateTransform() }]} />
      </View>

      <View style={styles.content}>
        {/* Animated Visualizer Centerpiece */}
        <Animated.View style={[styles.centerpiece, { opacity: visualizerOpacity, transform: [{ scale: centerpieceScale }] }]}>
          <View style={styles.visualizer}>
            {barAnims.map((anim, i) => (
              <Animated.View 
                key={i} 
                style={[
                  styles.bar, 
                  { 
                    height: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 60] }),
                    backgroundColor: i === 2 ? colors.primary : colors.primary + '88'
                  }
                ]} 
              />
            ))}
          </View>
          <View style={styles.logoBase}>
             <MaterialIcon name="music-note" size={70} color={colors.primary} />
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
                    { translateY: charAnims[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
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
          PREMIUM MUSIC EXPERIENCE
        </Animated.Text>
      </View>

      {/* Modern Progress Indicator or Error State */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        {isOffline ? (
          <View style={styles.errorContainer}>
            <MaterialIcon name="wifi-off" size={32} color="#ff4444" style={{ marginBottom: 10 }} />
            <Text style={styles.errorTitle}>Network Error</Text>
            <Text style={styles.errorSubtitle}>Please check your internet connection</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleNetworkCheck}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
          </>
        )}
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
    height: 200,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 70,
    position: 'absolute',
    top: 20,
  },
  bar: {
    width: 7,
    borderRadius: 4,
  },
  logoBase: {
    marginTop: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
  },
  brandChar: {
    fontSize: 60,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
    marginHorizontal: 1,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 6,
    marginTop: 15,
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    width: '80%',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 15,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  errorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  errorSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
