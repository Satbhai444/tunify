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
  FlatList,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, darkColors, lightColors, typography } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useSettingsStore, AudioQuality, AVATAR_OPTIONS } from '../stores/settingsStore';
import { useLibraryStore, usePlayerStore } from '../stores';
import { setPreferredQuality } from '../api/musicService';

const QUALITY_LABELS: Record<AudioQuality, string> = {
  low: '96kbps',
  normal: '160kbps',
  high: '320kbps',
};

// ─── Reusable Glass Setting Item ───
function SettingItem({ icon, label, value, onPress, toggle, onToggle, themeMode }: any) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={[styles.glassItemContainer, { borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <BlurView intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.glassItemBlur}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={onPress}
          activeOpacity={toggle !== undefined ? 1 : 0.7}
          disabled={toggle !== undefined}
        >
          <View style={[styles.iconCircle, { backgroundColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)' }]}>
            <MaterialIcon name={icon} size={20} color={theme.primary} />
          </View>
          <Text style={[styles.settingLabel, { color: theme.onSurface }]}>{label}</Text>
          {toggle !== undefined ? (
            <Switch
              value={toggle}
              onValueChange={onToggle}
              trackColor={{ false: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: theme.primary }}
              thumbColor="#FFF"
            />
          ) : (
            <View style={styles.valueRow}>
              {value && <Text style={[styles.settingValue, { color: theme.primary }]}>{value}</Text>}
              <MaterialIcon name="chevron-right" size={20} color={theme.onSurfaceVariant} />
            </View>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

// ─── Avatar Picker Component ───
function AvatarPicker({ selectedId, onSelect, themeMode }: { selectedId: string; onSelect: (id: string) => void; themeMode: 'dark' | 'light' }) {
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  return (
    <View style={styles.avatarGrid}>
      {AVATAR_OPTIONS.map((av) => (
        <TouchableOpacity
          key={av.id}
          onPress={() => onSelect(av.id)}
          style={[styles.avatarOption, selectedId === av.id && { borderColor: theme.primary }]}
        >
          <LinearGradient colors={av.bg} style={styles.avatarGradient}>
            <Text style={styles.avatarEmoji}>{av.emoji}</Text>
          </LinearGradient>
          {selectedId === av.id && (
            <View style={[styles.avatarCheck, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
              <MaterialIcon name="check" size={14} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Settings Screen ───
export function SettingsScreen({ navigation }: any) {
  const settings = useSettingsStore();
  const downloads = useLibraryStore((s) => s.downloads);
  const themeMode = settings.themeMode;
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  // Modal states
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(settings.userName);
  const [editEmail, setEditEmail] = useState(settings.userEmail);
  const [editBio, setEditBio] = useState(settings.userBio);
  const [editPhone, setEditPhone] = useState(settings.userPhone);
  const [editDob, setEditDob] = useState(settings.userDob);
  const [editGender, setEditGender] = useState(settings.userGender);
  const [editLocation, setEditLocation] = useState(settings.userLocation);
  const [editGenre, setEditGenre] = useState(settings.userGenre);
  const [editCountry, setEditCountry] = useState(settings.userCountry);
  const [editAvatarId, setEditAvatarId] = useState(settings.avatarId);

  const storageUsed = React.useMemo(() => {
    const bytes = downloads.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [downloads]);

  const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === settings.avatarId) || AVATAR_OPTIONS[0];

  const handleOpenProfile = () => {
    setEditName(settings.userName);
    setEditEmail(settings.userEmail);
    setEditBio(settings.userBio);
    setEditPhone(settings.userPhone);
    setEditDob(settings.userDob);
    setEditGender(settings.userGender);
    setEditLocation(settings.userLocation);
    setEditGenre(settings.userGenre);
    setEditCountry(settings.userCountry);
    setEditAvatarId(settings.avatarId);
    setProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    settings.setUserName(editName.trim());
    settings.setUserEmail(editEmail.trim());
    settings.setUserBio(editBio.trim());
    settings.setUserPhone(editPhone.trim());
    settings.setUserDob(editDob.trim());
    settings.setUserGender(editGender);
    settings.setUserLocation(editLocation.trim());
    settings.setUserGenre(editGenre.trim());
    settings.setUserCountry(editCountry.trim());
    settings.setAvatarId(editAvatarId);
    setProfileModalVisible(false);
  };

  const sleepTimerRemaining = usePlayerStore((s) => s.sleepTimerRemaining);
  const setSleepTimer = usePlayerStore((s) => s.setSleepTimer);
  const applyEqPreset = usePlayerStore((s) => s.applyEqPreset);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={themeMode === 'dark' ? ['#4F39CC', '#0D0D1F'] : ['#E0E7FF', '#F8F9FE']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenProfile}>
          <View style={[styles.glassItemContainer, { borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <BlurView intensity={30} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.glassItemBlur, styles.profileCard]}>
              <LinearGradient colors={selectedAvatar.bg} style={styles.avatar}>
                <Text style={styles.avatarText}>{selectedAvatar.emoji}</Text>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.onSurface }]}>{settings.userName}</Text>
                <Text style={[styles.profileEmail, { color: theme.onSurfaceVariant }]}>{settings.userEmail || 'Tap to set your profile'}</Text>
              </View>
              <View style={[styles.editBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <MaterialIcon name="edit" size={18} color={theme.onSurface} />
              </View>
            </BlurView>
          </View>
        </TouchableOpacity>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>Appearance</Text>
        <SettingItem
          icon="dark-mode"
          label="Dark Mode"
          themeMode={themeMode}
          toggle={settings.themeMode === 'dark'}
          onToggle={(v: boolean) => settings.setThemeMode(v ? 'dark' : 'light')}
        />

        {/* Audio & Playback */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>Audio & Playback</Text>
        <SettingItem
          icon="graphic-eq"
          label="Streaming Quality"
          themeMode={themeMode}
          value={QUALITY_LABELS[settings.audioQuality]}
          onPress={() => {
            Alert.alert('Quality', 'Choose audio quality', [
              { text: 'Low (96kbps)', onPress: () => { settings.setAudioQuality('low'); setPreferredQuality('96kbps'); } },
              { text: 'Normal (160kbps)', onPress: () => { settings.setAudioQuality('normal'); setPreferredQuality('160kbps'); } },
              { text: 'High (320kbps)', onPress: () => { settings.setAudioQuality('high'); setPreferredQuality('320kbps'); } },
            ]);
          }}
        />
        <SettingItem
          icon="tune"
          label="Equalizer"
          themeMode={themeMode}
          onPress={() => {
            Alert.alert('Equalizer', 'Select audio profile', [
              { text: 'Flat (Default)', onPress: () => applyEqPreset('flat') },
              { text: 'Bass Boost', onPress: () => applyEqPreset('bass') },
              { text: 'Crystal Treble', onPress: () => applyEqPreset('treble') },
              { text: 'Vocal Clarity', onPress: () => applyEqPreset('vocal') },
            ]);
          }}
        />
        <SettingItem
          icon="timer"
          label="Sleep Timer"
          themeMode={themeMode}
          value={sleepTimerRemaining ? `Ends in ${formatTime(sleepTimerRemaining)}` : 'Off'}
          onPress={() => {
            Alert.alert('Sleep Timer', 'Play music for...', [
              { text: 'Off', onPress: () => setSleepTimer(null) },
              { text: '5 Minutes', onPress: () => setSleepTimer(5) },
              { text: '15 Minutes', onPress: () => setSleepTimer(15) },
              { text: '30 Minutes', onPress: () => setSleepTimer(30) },
              { text: '60 Minutes', onPress: () => setSleepTimer(60) },
            ]);
          }}
        />
        <SettingItem icon="compare-arrows" label="Crossfade" themeMode={themeMode} toggle={settings.crossfadeEnabled} onToggle={(v: boolean) => settings.setCrossfade(v)} />
        <SettingItem icon="auto-awesome" label="Autoplay Similar" themeMode={themeMode} toggle={settings.autoPlayEnabled} onToggle={(v: boolean) => settings.setAutoPlay(v)} />
        <SettingItem icon="volume-up" label="Normalize Volume" themeMode={themeMode} toggle={settings.normalizeVolume} onToggle={(v: boolean) => settings.setNormalizeVolume(v)} />
        <SettingItem icon="explicit" label="Explicit Content Filter" themeMode={themeMode} toggle={settings.explicitContentFilter} onToggle={(v: boolean) => settings.setExplicitContentFilter(v)} />

        {/* Downloads & Storage */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>Downloads & Storage</Text>
        <SettingItem icon="sd-storage" label="Storage Used" themeMode={themeMode} value={storageUsed} />
        <SettingItem icon="wifi" label="Download Over Wi-Fi Only" themeMode={themeMode} toggle={settings.downloadOverWifiOnly} onToggle={(v: boolean) => settings.setDownloadOverWifiOnly(v)} />
        <SettingItem
          icon="delete-sweep"
          label="Clear Downloads"
          themeMode={themeMode}
          onPress={() => {
            Alert.alert('Confirm', 'Remove all downloads?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => {
                const dl = useLibraryStore.getState().downloads;
                dl.forEach((d) => useLibraryStore.getState().removeDownload(d.id));
                Alert.alert('Done', 'Downloads cleared');
              }},
            ]);
          }}
        />

        {/* Legal & Updates */}
        <Text style={[styles.sectionTitle, { color: theme.onSurfaceVariant }]}>Legal & Updates</Text>
        <SettingItem icon="system-update" label="Check for Updates" themeMode={themeMode} onPress={async () => {
          try {
            const u = await Updates.checkForUpdateAsync();
            Alert.alert(u.isAvailable ? 'Update available' : 'Up to date', u.isAvailable ? 'A new version is ready.' : 'You are on the latest version.');
          } catch { Alert.alert('Error', 'Update check failed.'); }
        }} />
        <SettingItem icon="description" label="Terms of Service" themeMode={themeMode} onPress={() => navigation.navigate('Terms')} />
        <SettingItem icon="privacy-tip" label="Privacy Policy" themeMode={themeMode} onPress={() => navigation.navigate('PrivacyPolicy')} />
        <SettingItem icon="code" label="About Developer" themeMode={themeMode} onPress={() => setAboutModalVisible(true)} />

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255, 75, 75, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderColor: themeMode === 'dark' ? 'rgba(255, 75, 75, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}
          onPress={async () => {
            await AsyncStorage.removeItem('tunify_onboarding_done');
            navigation.replace('Welcome');
          }}
        >
          <MaterialIcon name="logout" size={20} color={themeMode === 'dark' ? '#FF4B4B' : '#EF4444'} />
          <Text style={[styles.logoutText, { color: themeMode === 'dark' ? '#FF4B4B' : '#EF4444' }]}>Reset & Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.onSurfaceVariant }]}>TUNIFY V1.2.0</Text>
          <Text style={[styles.footerSubtext, { color: theme.primary }]}>MADE WITH ❤️ BY DARSHAN SATBHAI</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ═══════ Profile Edit Modal ═══════ */}
      <Modal visible={profileModalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.modalHandle, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
              <Text style={[styles.modalTitle, { color: theme.onSurface }]}>Edit Profile</Text>

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>CHOOSE AVATAR</Text>
              <AvatarPicker selectedId={editAvatarId} onSelect={setEditAvatarId} themeMode={themeMode} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>DISPLAY NAME</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={theme.onSurfaceVariant} maxLength={30} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>EMAIL</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editEmail} onChangeText={setEditEmail} placeholder="your@email.com" placeholderTextColor={theme.onSurfaceVariant} keyboardType="email-address" autoCapitalize="none" maxLength={50} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>BIO</Text>
              <TextInput style={[styles.textInput, { height: 80, textAlignVertical: 'top', color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editBio} onChangeText={setEditBio} placeholder="Tell us about yourself..." placeholderTextColor={theme.onSurfaceVariant} multiline maxLength={150} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>PHONE</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editPhone} onChangeText={setEditPhone} placeholder="+91 XXXXX XXXXX" placeholderTextColor={theme.onSurfaceVariant} keyboardType="phone-pad" maxLength={15} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>DATE OF BIRTH</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editDob} onChangeText={setEditDob} placeholder="DD/MM/YYYY" placeholderTextColor={theme.onSurfaceVariant} maxLength={10} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>GENDER</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, editGender === g && { backgroundColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)', borderColor: theme.primary }]}
                    onPress={() => setEditGender(g)}
                  >
                    <Text style={[styles.genderChipText, { color: theme.onSurfaceVariant }, editGender === g && { color: theme.primary }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>LOCATION</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editLocation} onChangeText={setEditLocation} placeholder="City, Country" placeholderTextColor={theme.onSurfaceVariant} maxLength={40} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>FAVORITE GENRE</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editGenre} onChangeText={setEditGenre} placeholder="Pop, Rock, Bollywood..." placeholderTextColor={theme.onSurfaceVariant} maxLength={40} />

              <Text style={[styles.inputLabel, { color: theme.onSurfaceVariant }]}>COUNTRY</Text>
              <TextInput style={[styles.textInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)' }]} value={editCountry} onChangeText={setEditCountry} placeholder="Your country" placeholderTextColor={theme.onSurfaceVariant} maxLength={40} />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setProfileModalVisible(false)}>
                  <Text style={[styles.modalCancelText, { color: theme.onSurfaceVariant }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]} onPress={handleSaveProfile}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════ About Developer Modal ═══════ */}
      <Modal visible={aboutModalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '75%' }]}>
            <View style={[styles.modalHandle, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <LinearGradient colors={['#7B61FF', '#4F39CC']} style={styles.devAvatar}>
                  <Text style={{ fontSize: 40 }}>👨‍💻</Text>
                </LinearGradient>
                <Text style={[styles.devName, { color: theme.onSurface }]}>Darshan Satbhai</Text>
                <Text style={[styles.devRole, { color: theme.primary }]}>Full-Stack Developer & Designer</Text>
                <Text style={[styles.devBio, { color: theme.onSurfaceVariant }]}>
                  Passionate about building beautiful mobile experiences. Tunify is crafted with love, modern design, and attention to detail. 🎶
                </Text>

                <View style={styles.devLinks}>
                  <TouchableOpacity style={[styles.devLinkBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} onPress={() => Linking.openURL('https://daarshannexaa.in')}>
                    <MaterialIcon name="language" size={20} color={theme.onSurface} />
                    <Text style={[styles.devLinkText, { color: theme.onSurface }]}>Portfolio</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.devLinkBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} onPress={() => Linking.openURL('https://github.com/daarshannexaa')}>
                    <MaterialIcon name="code" size={20} color={theme.onSurface} />
                    <Text style={[styles.devLinkText, { color: theme.onSurface }]}>GitHub</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.devVersion, { color: theme.onSurfaceVariant }]}>Tunify v1.2.0 • Built with React Native & Expo</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.modalCancelBtn, { width: '100%', marginBottom: 20, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setAboutModalVisible(false)}>
              <Text style={[styles.modalCancelText, { color: theme.onSurfaceVariant, textAlign: 'center' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  headerTitle: { ...typography.headlineSm, marginLeft: 16, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20 },
  glassItemContainer: { borderRadius: 24, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  glassItemBlur: { padding: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28 },
  profileInfo: { flex: 1 },
  profileName: { ...typography.titleLg, fontWeight: '700' },
  profileEmail: { ...typography.bodySm, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { ...typography.labelLg, fontWeight: '800', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { ...typography.titleSm, flex: 1, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { ...typography.labelLg, fontWeight: '700' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 40, paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  logoutText: { ...typography.titleSm, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 40, paddingBottom: 40 },
  footerText: { ...typography.labelSm, letterSpacing: 2, fontWeight: '800' },
  footerSubtext: { ...typography.labelSm, marginTop: 6, fontWeight: '700', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle: { ...typography.headlineSm, fontWeight: '800', marginBottom: 24 },
  inputLabel: { ...typography.labelSm, marginBottom: 8, marginTop: 16, letterSpacing: 1.5, fontWeight: '800' },
  textInput: { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, fontWeight: '500', borderWidth: 1 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderChip: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  genderChipText: { ...typography.titleSm, fontWeight: '700' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 32 },
  modalCancelBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  modalCancelText: { ...typography.titleSm, fontWeight: '600' },
  modalSaveBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  modalSaveText: { ...typography.titleSm, color: '#FFF', fontWeight: '700' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  avatarOption: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  avatarGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 28 },
  avatarCheck: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  devAvatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  devName: { ...typography.headlineSm, fontWeight: '800' },
  devRole: { ...typography.titleSm, marginTop: 4, fontWeight: '600' },
  devBio: { ...typography.bodyMd, textAlign: 'center', marginTop: 16, paddingHorizontal: 20, lineHeight: 22 },
  devLinks: { flexDirection: 'row', gap: 16, marginTop: 24 },
  devLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1 },
  devLinkText: { ...typography.labelLg, fontWeight: '600' },
  devVersion: { ...typography.labelSm, marginTop: 24 },
});
