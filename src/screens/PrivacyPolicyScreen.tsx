import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';

export function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F39CC', '#0D0D1F']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.bodyText}>
          Welcome to Tunify. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our music streaming service.
        </Text>

        <Text style={styles.sectionTitle}>2. Information Collection</Text>
        <Text style={styles.bodyText}>
          We collect usage data, such as your listening history, liked songs, and playlist names, to provide a personalized experience. All data is stored locally on your device or in your private cloud account.
        </Text>

        <Text style={styles.sectionTitle}>3. Third-Party Services</Text>
        <Text style={styles.bodyText}>
          Tunify integrates with third-party music APIs like JioSaavn and Deezer. These services may collect their own data according to their respective privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>4. Local Storage</Text>
        <Text style={styles.bodyText}>
          Downloaded tracks and app settings are stored locally on your device. We do not have access to these files on our servers.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact Us</Text>
        <Text style={styles.bodyText}>
          If you have any questions about this Privacy Policy, please contact us at support@tunify.app.
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
