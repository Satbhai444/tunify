import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';

export function TermsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F39CC', '#0D0D1F']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.bodyText}>
          By downloading or using tunify, you agree to be bound by these Terms of Service and all applicable laws and regulations.
        </Text>

        <Text style={styles.sectionTitle}>2. License to Use</Text>
        <Text style={styles.bodyText}>
          tunify grants you a limited, non-exclusive, non-transferable license to use the app for personal, non-commercial music listening and stream management.
        </Text>

        <Text style={styles.sectionTitle}>3. User Content</Text>
        <Text style={styles.bodyText}>
          You are responsible for all content you upload or manage within the app. Do not use tunify to infringe on intellectual property rights of any third party.
        </Text>

        <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
        <Text style={styles.bodyText}>
          tunify is provided "as is" without warranty of any kind. We are not liable for any direct or indirect damages arising from your use of the app.
        </Text>

        <Text style={styles.sectionTitle}>5. Modifications</Text>
        <Text style={styles.bodyText}>
          We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes your acceptance of the new terms.
        </Text>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    ...typography.headlineSm,
    color: '#FFF',
    marginLeft: 16,
    fontWeight: '800',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    ...typography.titleLg,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  bodyText: {
    ...typography.bodyLarge,
    color: '#A5A5C7',
    lineHeight: 24,
  },
});
