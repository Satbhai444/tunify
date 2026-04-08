import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useSettingsStore, AudioQuality } from '../stores/settingsStore';
import { useLibraryStore } from '../stores/libraryStore';
import { setPreferredQuality } from '../api/musicService';

const QUALITY_LABELS: Record<AudioQuality, string> = {
  low: '96kbps',
  normal: '160kbps',
  high: '320kbps',
};

function SettingItem({ icon, label, value, onPress, toggle, onToggle }: any) {
  return (
    <View style={styles.glassItemContainer}>
      <BlurView intensity={20} tint="dark" style={styles.glassItemBlur}>
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={onPress} 
          activeOpacity={toggle ? 1 : 0.7}
          disabled={!!toggle}
        >
          <View style={styles.iconCircle}>
            <MaterialIcon name={icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.settingLabel}>{label}</Text>
          {toggle ? (
            <Switch
              value={toggle}
              onValueChange={onToggle}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary }}
              thumbColor="#FFF"
            />
          ) : (
            <View style={styles.valueRow}>
              {value && <Text style={styles.settingValue}>{value}</Text>}
              <MaterialIcon name="chevron-right" size={20} color="#5C5C8A" />
            </View>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

export function SettingsScreen({ navigation }: any) {
  const settings = useSettingsStore();
  const downloads = useLibraryStore((s) => s.downloads);
  const [updateChecking, setUpdateChecking] = useState(false);

  const storageUsed = React.useMemo(() => {
    const bytes = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [downloads]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F39CC', '#0D0D1F']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={styles.glassItemContainer}>
          <BlurView intensity={30} tint="dark" style={[styles.glassItemBlur, styles.profileCard]}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{settings.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{settings.userName}</Text>
              <Text style={styles.profileEmail}>{settings.userEmail}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <MaterialIcon name="edit" size={18} color="#FFF" />
            </TouchableOpacity>
          </BlurView>
        </View>

        <Text style={styles.sectionTitle}>Audio & Playback</Text>
        <SettingItem 
          icon="graphic-eq" 
          label="Streaming Quality" 
          value={QUALITY_LABELS[settings.audioQuality]}
          onPress={() => {
            Alert.alert('Quality', 'Choose audio quality', [
              { text: 'Low (96kbps)', onPress: () => settings.setAudioQuality('low') },
              { text: 'Normal (160kbps)', onPress: () => settings.setAudioQuality('normal') },
              { text: 'High (320kbps)', onPress: () => settings.setAudioQuality('high') },
            ]);
          }}
        />
        <SettingItem 
          icon="compare-arrows" 
          label="Crossfade" 
          toggle={settings.crossfadeEnabled}
          onToggle={(v: boolean) => settings.setCrossfade(v)}
        />
        <SettingItem 
          icon="auto-awesome" 
          label="Autoplay Similar" 
          toggle={settings.autoPlayEnabled}
          onToggle={(v: boolean) => settings.setAutoPlay(v)}
        />

        <Text style={styles.sectionTitle}>Downloads & Storage</Text>
        <SettingItem 
          icon="sd-storage" 
          label="Storage Used" 
          value={storageUsed}
        />
        <SettingItem 
          icon="delete-sweep" 
          label="Clear Downloads" 
          onPress={() => {
            Alert.alert('Confirm', 'Remove all downloads?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => {
                const dl = useLibraryStore.getState().downloads;
                dl.forEach(d => useLibraryStore.getState().removeDownload(d.id));
                Alert.alert('Done', 'Downloads cleared');
              }}
            ]);
          }}
        />

        <Text style={styles.sectionTitle}>Legal & Updates</Text>
        <SettingItem 
          icon="system-update" 
          label="Check for Updates" 
          onPress={async () => {
            setUpdateChecking(true);
            try {
              const u = await Updates.checkForUpdateAsync();
              if (u.isAvailable) {
                Alert.alert('Update available', 'A new version is ready.');
              } else {
                Alert.alert('Up to date', 'You are on the latest version.');
              }
            } catch {
              Alert.alert('Error', 'Update check failed.');
            } finally {
              setUpdateChecking(false);
            }
          }}
        />
        <SettingItem 
          icon="description" 
          label="Terms of Service" 
          onPress={() => navigation.navigate('Terms')}
        />
        <SettingItem 
          icon="privacy-tip" 
          label="Privacy Policy" 
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={async () => {
             await AsyncStorage.removeItem('tunify_onboarding_done');
             navigation.replace('Welcome');
          }}
        >
          <MaterialIcon name="logout" size={20} color="#FF4B4B" />
          <Text style={styles.logoutText}>Reset & Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
           <Text style={styles.footerText}>TUNIFY V1.2.0</Text>
           <Text style={styles.footerSubtext}>MADE WITH ❤️ BY DARSHAN SATBHAI</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  glassItemContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  glassItemBlur: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.titleLg,
    color: '#FFF',
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.bodySm,
    color: '#A5A5C7',
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.labelLg,
    color: '#5C5C8A',
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    ...typography.titleSm,
    color: '#FFF',
    flex: 1,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 40,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 75, 75, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.1)',
  },
  logoutText: {
    ...typography.titleSm,
    color: '#FF4B4B',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 40,
  },
  footerText: {
    ...typography.labelSm,
    color: '#5C5C8A',
    letterSpacing: 2,
    fontWeight: '800',
  },
  footerSubtext: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 6,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
