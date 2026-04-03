import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';

export function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    // For now, skip auth and go to main app
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Main');
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#121212', '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top glow */}
      <View style={styles.topGlow} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.header}>
          <MaterialIcon name="graphic-eq" size={48} color={colors.primary} />
          <Text style={styles.appName}>Tunify</Text>
          <Text style={styles.tagline}>Music. Free. Forever.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {/* Sign In Button */}
          <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity style={styles.googleButton} activeOpacity={0.8} onPress={handleAuth}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.footerLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Skip for now */}
        <TouchableOpacity onPress={() => navigation.replace('Main')} style={{ marginTop: 12 }}>
          <Text style={[styles.footerLink, { fontSize: 12 }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primaryContainer,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    ...typography.displaySm,
    color: colors.onSurface,
    marginTop: 16,
  },
  tagline: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 8,
    letterSpacing: 1,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    color: colors.onSurface,
    fontFamily: 'Inter',
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    ...typography.titleMd,
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.3,
  },
  dividerText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginHorizontal: 16,
  },
  googleButton: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '700',
  },
});
