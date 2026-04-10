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
          Welcome to Tunify. Your privacy is our top priority. This Privacy Policy outlines how we handle your data, ensuring a secure and transparent music streaming experience. By using Tunify, you agree to the practices described in this policy.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.bodyText}>
          • <Text style={{fontWeight: 'bold', color: '#FFF'}}>Listening Profile:</Text> We analyze your listening habits to provide personalized recommendations.
          {"\n"}• <Text style={{fontWeight: 'bold', color: '#FFF'}}>Library Data:</Text> Your liked songs, playlists, and recently played tracks are stored to manage your library.
          {"\n"}• <Text style={{fontWeight: 'bold', color: '#FFF'}}>Device Info:</Text> We may collect non-personal device information to optimize app performance.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Security & Storage</Text>
        <Text style={styles.bodyText}>
          All sensitive data, including your downloads and personal settings, is stored locally on your device or in your private encrypted cloud storage (where applicable). We implement industry-standard encryption to protect your data from unauthorized access.
        </Text>

        <Text style={styles.sectionTitle}>4. Third-Party Integrations</Text>
        <Text style={styles.bodyText}>
          Tunify uses third-party APIs (like JioSaavn, Deezer) to fetch music. These services have their own privacy policies. We do not sell or share your personal listening data with these providers in an identifiable format.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.bodyText}>
          You have the right to access, export, or delete your local data at any time through the app settings. Since most data is local, you have full control over your privacy.
        </Text>

        <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
        <Text style={styles.bodyText}>
          Tunify is not intended for children under 13. We do not knowingly collect personal information from children. If you believe such data has been collected, please contact us.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
        <Text style={styles.bodyText}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact Us & Support</Text>
        <View style={styles.contactInfo}>
            <Text style={styles.bodyText}>For any privacy-related concerns or support, reach out to us:</Text>
            <Text style={[styles.bodyText, {color: colors.primary, marginTop: 8}]}>Email: darshansatbhai38@gmail.com</Text>
            <Text style={[styles.bodyText, {color: colors.primary}]}>Phone: +91 6351015778</Text>
        </View>
        
        <View style={{ height: 60 }} />
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
