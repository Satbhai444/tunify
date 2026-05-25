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

const LOADING_STEPS = [
  '01 // SYS.INIT',
  '02 // NETWORK.CHECK',
  '03 // CACHE.TUNING',
  '04 // READY.PLAY'
];
const BRAND_CHARS = 'tunify'.split('');

export function SplashScreen({ navigation }: any) {
  const [isOffline, setIsOffline] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // --- Background Aura Animations ---
  const blob1Pos = useRef(new Animated.ValueXY({ x: -100, y: -100 })).current;
  const blob2Pos = useRef(new Animated.ValueXY({ x: SCREEN_W, y: SCREEN_H / 3 })).current;
  const blob3Pos = useRef(new Animated.ValueXY({ x: SCREEN_W / 3, y: SCREEN_H })).current;

  // --- Centerpiece Animations (Redesigned: Sonic Core Pulsing Ring) ---
  const visualizerOpacity = useRef(new Animated.Value(0)).current;
  const centerpieceScale = useRef(new Animated.Value(0.8)).current;
  const ringScale1 = useRef(new Animated.Value(0.8)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.6)).current;
  const ringScale2 = useRef(new Animated.Value(0.6)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.4)).current;

  // --- Text & Loader Animations ---
  const charAnims = useRef(BRAND_CHARS.map(() => new Animated.Value(0))).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  const startAppLoading = () => {
    // 4. Progress Loading
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
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
    }, 3800);

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
    // Start Aura Floating Animations (Slow, organic)
    const createBlobAnimation = (anim: Animated.ValueXY, to: { x: number, y: number }, duration: number) => {
      const from = { x: (anim.x as any)._value, y: (anim.y as any)._value };
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: to, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };

    createBlobAnimation(blob1Pos, { x: 50, y: 100 }, 12000);
    createBlobAnimation(blob2Pos, { x: 0, y: SCREEN_H / 2.5 }, 14000);
    createBlobAnimation(blob3Pos, { x: SCREEN_W / 1.5, y: SCREEN_H - 150 }, 13000);

    // Start Redesigned Sonic Ring Resonating Animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale1, { toValue: 2.2, duration: 2500, easing: Easing.out(Easing.sin), useNativeDriver: true }),
          Animated.timing(ringScale1, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity1, { toValue: 0, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(ringOpacity1, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(ringScale2, { toValue: 2.2, duration: 2500, easing: Easing.out(Easing.sin), useNativeDriver: true }),
          Animated.timing(ringScale2, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(ringOpacity2, { toValue: 0, duration: 2500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(ringOpacity2, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Intro Animation Sequence
    Animated.parallel([
      Animated.timing(visualizerOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(centerpieceScale, { toValue: 1, friction: 9, tension: 35, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(500),
        Animated.stagger(100, charAnims.map(anim => 
          Animated.spring(anim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true })
        )),
        Animated.parallel([
          Animated.timing(footerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(tagOpacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ]).start();

    // Initial Network Check
    handleNetworkCheck();

  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Dynamic Background Aura (Electric Editorial Dark Perfect) */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#151515', '#000000', '#0a0a0a']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(147, 3, 46, 0.12)', transform: blob1Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(127, 1, 31, 0.08)', width: 380, height: 380, transform: blob2Pos.getTranslateTransform() }]} />
        <Animated.View style={[styles.blob, { backgroundColor: 'rgba(74, 2, 23, 0.06)', width: 280, height: 280, transform: blob3Pos.getTranslateTransform() }]} />
      </View>

      {/* Asymmetric Technical Tag */}
      <Animated.View style={[styles.catalogTag, { opacity: tagOpacity }]}>
        <Text style={styles.catalogTagText}>TUNIFY.SYS // ED.2026</Text>
        <View style={styles.catalogDot} />
      </Animated.View>

      <View style={styles.content}>
        {/* Animated Sonic Core Pulsing Ring centerpiece */}
        <Animated.View style={[styles.centerpiece, { opacity: visualizerOpacity, transform: [{ scale: centerpieceScale }] }]}>
          <Animated.View 
            style={[
              styles.sonicRing, 
              { 
                borderColor: '#93032E', 
                opacity: ringOpacity1, 
                transform: [{ scale: ringScale1 }] 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.sonicRing, 
              { 
                borderColor: '#7F011F', 
                opacity: ringOpacity2, 
                transform: [{ scale: ringScale2 }] 
              }
            ]} 
          />
          
          <View style={styles.logoBase}>
            <LinearGradient 
              colors={['#93032E', '#7F011F']} 
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.logoCircle}
            >
              <MaterialIcon name="play-arrow" size={38} color="#151515" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Staggered Brand Text in BebasNote (Handwritten marker) */}
        <View style={styles.brandContainer}>
          {BRAND_CHARS.map((char, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.brandChar,
                {
                  opacity: charAnims[i],
                  transform: [
                    { translateY: charAnims[i].interpolate({ inputRange: [0, 1], outputRange: [25, 0] }) },
                    { scale: charAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }
                  ]
                }
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>
      </View>

      {/* Editorial Progress Indicator */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        {isOffline ? (
          <View style={styles.errorContainer}>
            <MaterialIcon name="wifi-off" size={28} color="#ff5c5c" style={{ marginBottom: 12 }} />
            <Text style={styles.errorTitle}>CONNECTION INTERRUPTED</Text>
            <Text style={styles.errorSubtitle}>Establish data link to stream</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleNetworkCheck}>
              <Text style={styles.retryBtnText}>Retry Link</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.loaderMeta}>
              <Text style={styles.loadingText}>{LOADING_STEPS[loadingStep]}</Text>
              <Text style={styles.percentageText}>
                {loadingStep === 0 ? '25%' : loadingStep === 1 ? '50%' : loadingStep === 2 ? '75%' : '100%'}
              </Text>
            </View>
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
                  colors={['rgba(147, 3, 46, 0.3)', '#7F011F']} 
                  start={{x: 0, y: 0}} 
                  end={{x: 1, y: 0}} 
                  style={StyleSheet.absoluteFill} 
                />
              </Animated.View>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 250,
    opacity: 0.65,
  },
  catalogTag: {
    position: 'absolute',
    top: 55,
    left: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catalogTagText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '700',
    letterSpacing: 2,
  },
  catalogDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#93032E',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  centerpiece: {
    height: 220,
    width: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  sonicRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  logoBase: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#131313',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#72fe8f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginTop: 10,
  },
  brandChar: {
    fontSize: 66,
    color: '#FFFFFF',
    textShadowColor: 'rgba(114, 254, 143, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    marginHorizontal: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#93032E',
    letterSpacing: 5,
    marginTop: 5,
    opacity: 0.95,
  },
  footer: {
    position: 'absolute',
    bottom: 75,
    width: '84%',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
  },
  loaderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 9,
    color: '#93032E',
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressTrack: {
    width: '100%',
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: '#131313',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  errorTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  errorSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#93032E',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#151515',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
