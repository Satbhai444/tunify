import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, NativeModules, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Configure Google Sign-In with dynamic check for native module availability
let GoogleSignin: any;
let statusCodes: any = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

const hasGoogleSignin = !!NativeModules.RNGoogleSignin;

if (hasGoogleSignin) {
  try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
    statusCodes = { ...statusCodes, ...googleSigninModule.statusCodes };
  } catch (e) {
    console.warn('[Auth] Failed to load @react-native-google-signin/google-signin:', e);
  }
}

if (!GoogleSignin) {
  // Mock GoogleSignin object to prevent crash when running in Expo Go
  GoogleSignin = {
    configure: () => {
      console.log('[Auth] GoogleSignin (Mock): Configure called');
    },
    hasPlayServices: async () => {
      console.log('[Auth] GoogleSignin (Mock): hasPlayServices called');
      return false;
    },
    signIn: async () => {
      console.log('[Auth] GoogleSignin (Mock): signIn called');
      throw new Error('Google Sign-In is not supported in Expo Go. Please use a native development build or tap "Skip for now".');
    },
    signOut: async () => {
      console.log('[Auth] GoogleSignin (Mock): signOut called');
    },
  };
}

GoogleSignin.configure({
  webClientId: '798226911568-aur98kfvm38spo1hhi7lgespn4cpra4j.apps.googleusercontent.com',
  offlineAccess: false,
});

export function AuthScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigation.replace('Main');
      }
    });
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Get the credential
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID Token found');
      
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase
      await signInWithCredential(auth, credential);
      navigation.replace('Main');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Gradient & Premium Glowing Aura */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#151515', '#000000']} style={StyleSheet.absoluteFill} />
        <View style={styles.radialGlowGreen} />
        <View style={styles.radialGlowPurple} />
      </View>

      {/* Asymmetrical Floating Graphic Elements */}
      <View style={styles.abstractGraphicCircle} />
      <View style={styles.abstractGraphicSmall} />

      <View style={styles.layoutWrapper}>
        
        {/* Asymmetrical Editorial Header */}
        <View style={styles.heroHeader}>
          <Text style={styles.catalogTag}>TUNIFY.SYS // SECURITY.CONSOLE</Text>
          <Text style={styles.heroDisplayTitle}>
            Soundtrack{"\n"}your moments.{"\n"}Welcome to{"\n"}Tunify.
          </Text>
          <View style={styles.taglineWrapper}>
            <View style={styles.pulseDot} />
            <Text style={styles.heroTagline}>PREMIUM EDITION</Text>
          </View>
        </View>

        {/* Floating Glassmorphic Control Console */}
        <BlurView 
          intensity={30} 
          tint="dark" 
          style={styles.glassConsole}
        >
          <View style={styles.consoleHeader}>
            <View style={styles.brandRow}>
              <MaterialIcon name="play-circle-filled" size={24} color="#93032E" />
              <Text style={styles.consoleTitle}>TUNIFY GATEWAY</Text>
            </View>
            <Text style={styles.consoleSubtitle}>SECURE AUTHENTICATION REQUIRED</Text>
          </View>

          <View style={styles.buttonContainer}>
            {/* Redesigned Premium Google Button */}
            <TouchableOpacity 
              style={styles.googleButton} 
              activeOpacity={0.85} 
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <LinearGradient 
                colors={['#ffffff', '#f0f0f0']} 
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#0e0e0e" />
                ) : (
                  <>
                    <MaterialIcon name="login" size={20} color="#0e0e0e" />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Redesigned Premium Skip Button */}
            <TouchableOpacity 
              style={styles.skipButton} 
              activeOpacity={0.8} 
              onPress={() => navigation.replace('Main')}
            >
              <View style={styles.skipBtnContent}>
                <MaterialIcon name="arrow-forward" size={18} color="#93032E" />
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footerTerms}>
            <Text style={styles.termsText}>
              BY CONTINUING, YOU AGREE TO TUNIFY'S TERMS OF SERVICE AND PRIVACY REGISTRY.
            </Text>
          </View>
        </BlurView>
        
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  radialGlowGreen: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(147, 3, 46, 0.08)',
    filter: Platform.OS === 'ios' ? 'blur(80px)' : undefined,
  },
  radialGlowPurple: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(74, 2, 23, 0.08)',
    filter: Platform.OS === 'ios' ? 'blur(100px)' : undefined,
  },
  abstractGraphicCircle: {
    position: 'absolute',
    top: SCREEN_H * 0.28,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.03)',
    borderStyle: 'dashed',
  },
  abstractGraphicSmall: {
    position: 'absolute',
    top: SCREEN_H * 0.42,
    right: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 3, 46, 0.03)',
  },
  layoutWrapper: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
  },
  heroHeader: {
    alignItems: 'flex-start',
    marginTop: 20,
  },
  catalogTag: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.35)',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
  },
  heroDisplayTitle: {
    fontSize: 48,
    fontFamily: typography.displayLg.fontFamily,
    color: '#ffffff',
    lineHeight: 52,
    textShadowColor: 'rgba(255,255,255,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#93032E',
  },
  heroTagline: {
    fontSize: 12,
    color: '#93032E',
    letterSpacing: 3,
    fontWeight: '700',
  },
  glassConsole: {
    borderRadius: 36,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(19, 19, 19, 0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
  },
  consoleHeader: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  consoleTitle: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 2,
  },
  consoleSubtitle: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  buttonContainer: {
    gap: 16,
  },
  googleButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 18,
    color: '#0e0e0e',
    letterSpacing: 0.5,
  },
  skipButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(147, 3, 46, 0.35)',
    backgroundColor: 'rgba(147, 3, 46, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skipButtonText: {
    fontSize: 18,
    color: '#93032E',
    letterSpacing: 0.5,
  },
  footerTerms: {
    marginTop: 28,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.25)',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },
});
