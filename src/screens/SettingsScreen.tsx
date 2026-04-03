import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radii } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useSettingsStore, AudioQuality } from '../stores/settingsStore';
import { useLibraryStore } from '../stores/libraryStore';
import { setPreferredQuality } from '../api/musicService';

const QUALITY_LABELS: Record<AudioQuality, string> = {
  low: 'Low (96kbps)',
  normal: 'Normal (160kbps)',
  high: 'High (320kbps)',
};

const QUALITY_KBPS: Record<AudioQuality, string> = {
  low: '96kbps',
  normal: '160kbps',
  high: '320kbps',
};

const CROSSFADE_OPTIONS = [2, 3, 5, 8, 10, 12];

function safeGoBack(navigation: any) {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }
}

export function SettingsScreen({ navigation }: any) {
  const settings = useSettingsStore();
  const downloads = useLibraryStore((s) => s.downloads);
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const playlists = useLibraryStore((s) => s.playlists);

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState(settings.userName);
  const [editEmail, setEditEmail] = useState(settings.userEmail);

  // Calculate storage used by downloads
  const storageUsed = React.useMemo(() => {
    const bytes = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [downloads]);

  const handleQualityChange = (q: AudioQuality) => {
    settings.setAudioQuality(q);
    setPreferredQuality(QUALITY_KBPS[q]);
  };

  const handleCrossfadeDuration = () => {
    Alert.alert(
      'Crossfade Duration',
      `Current: ${settings.crossfadeDuration}s`,
      CROSSFADE_OPTIONS.map((sec) => ({
        text: `${sec} seconds`,
        onPress: () => settings.setCrossfadeDuration(sec),
      })),
    );
  };

  const handleEditProfile = () => {
    setEditName(settings.userName);
    setEditEmail(settings.userEmail);
    setProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    settings.setUserName(trimmedName);
    settings.setUserEmail(trimmedEmail);
    setProfileModalVisible(false);
    Alert.alert('Profile Updated', 'Your profile has been saved.');
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'This is a local-only app. Your data is stored on device. No server password to change.\n\nTo protect your device, use your phone\'s screen lock settings.',
      [{ text: 'OK' }],
    );
  };

  const handleClearCache = async () => {
    Alert.alert('Clear Cache', 'This will clear cached images and API data. Your downloads, liked songs and playlists will not be affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const keysToKeep = [
              'tunify_settings',
              'tunify_liked_songs',
              'tunify_playlists',
              'tunify_playlist_tracks',
              'tunify_downloads',
              'tunify_recently_played',
            ];
            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter((k) => !keysToKeep.includes(k));
            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }
            Alert.alert('Done', `Cleared ${keysToRemove.length} cached items.`);
          } catch {
            Alert.alert('Error', 'Failed to clear cache.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out? Your liked songs and playlists will be preserved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => navigation.replace('Auth'),
      },
    ]);
  };

  const handleResetSettings = () => {
    Alert.alert('Reset Settings', 'Reset all settings to default values?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          settings.resetSettings();
          Alert.alert('Done', 'Settings have been reset to defaults.');
        },
      },
    ]);
  };

  const handleStorageDetails = () => {
    Alert.alert(
      'Storage Details',
      `Downloads: ${downloads.length} songs\nStorage used: ${storageUsed}\nLiked songs: ${likedSongs.length}\nPlaylists: ${playlists.length}`,
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(navigation)} hitSlop={{ top: 10, bottom: 10 }}>
          <MaterialIcon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={handleEditProfile} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {settings.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{settings.userName}</Text>
            <Text style={styles.profileEmail}>{settings.userEmail}</Text>
            <Text style={styles.profileStats}>
              {likedSongs.length} liked • {playlists.length} playlists • {downloads.length} downloads
            </Text>
          </View>
          <MaterialIcon name="edit" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.settingRow} onPress={handleEditProfile} activeOpacity={0.7}>
            <MaterialIcon name="person" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <MaterialIcon name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={handleChangePassword} activeOpacity={0.7}>
            <MaterialIcon name="key" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Change Password</Text>
            <MaterialIcon name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Audio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert('Streaming Quality', 'Choose audio quality', [
                { text: 'Low (96kbps)', onPress: () => handleQualityChange('low') },
                { text: 'Normal (160kbps)', onPress: () => handleQualityChange('normal') },
                { text: 'High (320kbps)', onPress: () => handleQualityChange('high') },
              ]);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcon name="graphic-eq" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Streaming Quality</Text>
            <Text style={styles.settingValue}>{QUALITY_LABELS[settings.audioQuality]}</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <MaterialIcon name="compare-arrows" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Crossfade</Text>
            <Switch
              value={settings.crossfadeEnabled}
              onValueChange={(v) => settings.setCrossfade(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.crossfadeEnabled ? colors.primary : colors.onSurfaceVariant}
            />
          </View>

          {settings.crossfadeEnabled && (
            <TouchableOpacity style={styles.settingRowIndented} onPress={handleCrossfadeDuration} activeOpacity={0.7}>
              <MaterialIcon name="timer" size={22} color={colors.onSurfaceVariant} />
              <Text style={styles.settingLabel}>Crossfade Duration</Text>
              <Text style={styles.settingValue}>{settings.crossfadeDuration}s</Text>
            </TouchableOpacity>
          )}

          <View style={styles.settingRow}>
            <MaterialIcon name="all-inclusive" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Gapless Playback</Text>
            <Switch
              value={settings.gaplessEnabled}
              onValueChange={(v) => settings.setGapless(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.gaplessEnabled ? colors.primary : colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.settingRow}>
            <MaterialIcon name="volume-up" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Normalize Volume</Text>
            <Switch
              value={settings.normalizeVolume}
              onValueChange={(v) => settings.setNormalizeVolume(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.normalizeVolume ? colors.primary : colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.settingRow}>
            <MaterialIcon name="auto-awesome" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Autoplay Similar Songs</Text>
            <Switch
              value={settings.autoPlayEnabled}
              onValueChange={(v) => settings.setAutoPlay(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.autoPlayEnabled ? colors.primary : colors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <View style={styles.settingRow}>
            <MaterialIcon name="explicit" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Filter Explicit Content</Text>
            <Switch
              value={settings.explicitContentFilter}
              onValueChange={(v) => settings.setExplicitContentFilter(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.explicitContentFilter ? colors.primary : colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.settingRow}>
            <MaterialIcon name="cloud-off" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Switch
              value={settings.offlineMode}
              onValueChange={(v) => settings.setOfflineMode(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.offlineMode ? colors.primary : colors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* Downloads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads & Storage</Text>
          <View style={styles.settingRow}>
            <MaterialIcon name="wifi" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Download via Wi-Fi only</Text>
            <Switch
              value={settings.downloadOverWifiOnly}
              onValueChange={(v) => settings.setDownloadOverWifiOnly(v)}
              trackColor={{ false: colors.surfaceContainerHighest, true: colors.primaryContainer }}
              thumbColor={settings.downloadOverWifiOnly ? colors.primary : colors.onSurfaceVariant}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handleStorageDetails} activeOpacity={0.7}>
            <MaterialIcon name="sd-storage" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Storage</Text>
            <Text style={styles.settingValue}>{storageUsed} • {downloads.length} songs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert('Clear Downloads', `Remove all ${downloads.length} downloaded songs?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    const dl = useLibraryStore.getState().downloads;
                    dl.forEach((d) => useLibraryStore.getState().removeDownload(d.id));
                    Alert.alert('Done', 'All downloads cleared.');
                  },
                },
              ]);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcon name="delete-sweep" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Clear All Downloads</Text>
            <MaterialIcon name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache} activeOpacity={0.7}>
            <MaterialIcon name="cached" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Clear Cache</Text>
            <MaterialIcon name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <MaterialIcon name="info" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://www.termsfeed.com/live/generic')}
            activeOpacity={0.7}
          >
            <MaterialIcon name="description" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <MaterialIcon name="open-in-new" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://www.termsfeed.com/live/generic')}
            activeOpacity={0.7}
          >
            <MaterialIcon name="privacy-tip" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <MaterialIcon name="open-in-new" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleResetSettings} activeOpacity={0.7}>
            <MaterialIcon name="restore" size={22} color={colors.onSurfaceVariant} />
            <Text style={[styles.settingLabel, { color: colors.error }]}>Reset All Settings</Text>
            <MaterialIcon name="chevron-right" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcon name="logout" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Credits */}
        <TouchableOpacity
          style={styles.creditsButton}
          onPress={() => navigation.navigate('Credits')}
          activeOpacity={0.7}
        >
          <MaterialIcon name="workspace-premium" size={22} color={colors.primary} />
          <Text style={styles.creditsText}>Credits</Text>
          <MaterialIcon name="chevron-right" size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', paddingVertical: 24, paddingBottom: 40, marginTop: 8 }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600', letterSpacing: 1.5, marginBottom: 4 }}>MADE WITH ❤️ IN INDIA</Text>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>MADE BY DARSHAN SATBHAI</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.outlineVariant}
              maxLength={30}
              autoFocus
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.outlineVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.titleMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  profileStats: {
    ...typography.bodySm,
    color: colors.primary,
    marginTop: 4,
    fontSize: 11,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xl,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  settingRowIndented: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    paddingLeft: spacing.xl + 38,
  },
  settingLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  settingValue: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 32,
  },
  logoutText: {
    ...typography.titleSm,
    color: colors.error,
    fontWeight: '600',
  },
  creditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 8,
  },
  creditsText: {
    ...typography.titleSm,
    color: colors.primary,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 24,
  },
  modalTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.onSurface,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  modalCancelText: {
    ...typography.titleSm,
    color: colors.onSurfaceVariant,
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
  },
  modalSaveText: {
    ...typography.titleSm,
    color: colors.background,
    fontWeight: '700',
  },
});
