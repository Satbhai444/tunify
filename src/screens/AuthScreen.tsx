import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '798226911568-aur98kfvm38spo1hhi7lgespn4cpra4j.apps.googleusercontent.com',
  offlineAccess: false,
});

export function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    // Standard email/password placeholder or implementation can go here
    // For now focusing on Google Auth as requested
    handleGoogleSignIn();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0e0e0e', '#050505']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topGlow} />

      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcon name="music-note" size={56} color={colors.primary} />
          <Text style={styles.appName}>tunify</Text>
          <Text style={styles.tagline}>Your Music. Everywhere.</Text>
        </View>

        <View style={styles.form}>
          {/* Google Button */}
          <TouchableOpacity 
            style={styles.googleButton} 
            activeOpacity={0.8} 
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onSurface} />
            ) : (
              <>
                <MaterialIcon name="login" size={24} color={colors.onSurface} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>SECURE AUTHENTICATION</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <Text style={styles.infoText}>
            By continuing, you agree to Tunify's Terms of Service and Privacy Policy.
          </Text>
        </View>

        {/* Skip for now */}
        <TouchableOpacity 
          onPress={() => navigation.replace('Main')} 
          style={{ marginTop: 32, alignSelf: 'center' }}
        >
          <Text style={styles.footerLink}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  topGlow: {
    position: 'absolute',
    top: -150,
    left: '50%',
    marginLeft: -250,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    marginTop: 10,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  form: {
    gap: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 15,
    letterSpacing: 2,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
