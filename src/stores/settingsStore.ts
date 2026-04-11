import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'tunify_settings';

export type AudioQuality = 'low' | 'normal' | 'high';
export type ThemeMode = 'dark' | 'light';

// 12 suggested avatar options (gradient-based identifiers)
export const AVATAR_OPTIONS: { id: string; emoji: string; bg: [string, string] }[] = [
  { id: 'av1', emoji: '🎵', bg: ['#7B61FF', '#4F39CC'] },
  { id: 'av2', emoji: '🎧', bg: ['#FF6B6B', '#EE5A24'] },
  { id: 'av3', emoji: '🎤', bg: ['#00C9FF', '#92FE9D'] },
  { id: 'av4', emoji: '🦊', bg: ['#F97316', '#B45309'] },
  { id: 'av5', emoji: '🐱', bg: ['#EC4899', '#BE185D'] },
  { id: 'av6', emoji: '🦄', bg: ['#A78BFA', '#7C3AED'] },
  { id: 'av7', emoji: '🐼', bg: ['#6B7280', '#374151'] },
  { id: 'av8', emoji: '🌊', bg: ['#06B6D4', '#0E7490'] },
  { id: 'av9', emoji: '🔥', bg: ['#EF4444', '#991B1B'] },
  { id: 'av10', emoji: '⚡', bg: ['#F59E0B', '#D97706'] },
  { id: 'av11', emoji: '🌸', bg: ['#F472B6', '#DB2777'] },
  { id: 'av12', emoji: '🎮', bg: ['#10B981', '#047857'] },
  { id: 'av13', emoji: '🚀', bg: ['#2563EB', '#1D4ED8'] },
  { id: 'av14', emoji: '🌈', bg: ['#A855F7', '#D946EF'] },
  { id: 'av15', emoji: '👑', bg: ['#FACC15', '#EAB308'] },
  { id: 'av16', emoji: '💎', bg: ['#38BDF8', '#0EA5E9'] },
];

export interface SettingsState {
  // Theme
  themeMode: ThemeMode;
  
  // Audio
  audioQuality: AudioQuality;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  gaplessEnabled: boolean;
  autoPlayEnabled: boolean;
  downloadOverWifiOnly: boolean;
  offlineMode: boolean;
  normalizeVolume: boolean;
  explicitContentFilter: boolean;

  // Profile
  userName: string;
  userEmail: string;
  userBio: string;
  userPhone: string;
  userDob: string;
  userGender: string;
  userLocation: string;
  userGenre: string;
  userCountry: string;
  avatarId: string; // references AVATAR_OPTIONS id
  launchCount: number;
  hasRated: boolean;
  lastSeenUpdateId: string;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAudioQuality: (q: AudioQuality) => void;
  setCrossfade: (enabled: boolean) => void;
  setCrossfadeDuration: (seconds: number) => void;
  setGapless: (enabled: boolean) => void;
  setAutoPlay: (enabled: boolean) => void;
  setDownloadOverWifiOnly: (enabled: boolean) => void;
  setOfflineMode: (enabled: boolean) => void;
  setNormalizeVolume: (enabled: boolean) => void;
  setExplicitContentFilter: (enabled: boolean) => void;
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setUserBio: (bio: string) => void;
  setUserPhone: (phone: string) => void;
  setUserDob: (dob: string) => void;
  setUserGender: (gender: string) => void;
  setUserLocation: (location: string) => void;
  setUserGenre: (genre: string) => void;
  setUserCountry: (country: string) => void;
  setAvatarId: (id: string) => void;
  incrementLaunchCount: () => void;
  setHasRated: (rated: boolean) => void;
  setLastSeenUpdateId: (id: string) => void;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

async function persist(partial: Partial<SettingsState>) {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const current = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
  } catch {}
}

const DEFAULTS = {
  themeMode: 'dark' as ThemeMode,
  audioQuality: 'normal' as AudioQuality,
  crossfadeEnabled: false,
  crossfadeDuration: 5,
  gaplessEnabled: true,
  autoPlayEnabled: true,
  downloadOverWifiOnly: true,
  offlineMode: false,
  normalizeVolume: false,
  explicitContentFilter: false,
  userName: 'Tunify User',
  userEmail: '',
  userBio: '',
  userPhone: '',
  userDob: '',
  userGender: '',
  userLocation: '',
  userGenre: '',
  userCountry: '',
  avatarId: 'av1',
  launchCount: 0,
  hasRated: false,
  lastSeenUpdateId: '',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  setThemeMode: (mode) => { set({ themeMode: mode }); persist({ themeMode: mode }); },
  setAudioQuality: (q) => { set({ audioQuality: q }); persist({ audioQuality: q }); },
  setCrossfade: (enabled) => { set({ crossfadeEnabled: enabled }); persist({ crossfadeEnabled: enabled }); },
  setCrossfadeDuration: (seconds) => { set({ crossfadeDuration: seconds }); persist({ crossfadeDuration: seconds }); },
  setGapless: (enabled) => { set({ gaplessEnabled: enabled }); persist({ gaplessEnabled: enabled }); },
  setAutoPlay: (enabled) => { set({ autoPlayEnabled: enabled }); persist({ autoPlayEnabled: enabled }); },
  setDownloadOverWifiOnly: (enabled) => { set({ downloadOverWifiOnly: enabled }); persist({ downloadOverWifiOnly: enabled }); },
  setOfflineMode: (enabled) => { set({ offlineMode: enabled }); persist({ offlineMode: enabled }); },
  setNormalizeVolume: (enabled) => { set({ normalizeVolume: enabled }); persist({ normalizeVolume: enabled }); },
  setExplicitContentFilter: (enabled) => { set({ explicitContentFilter: enabled }); persist({ explicitContentFilter: enabled }); },
  setUserName: (name) => { set({ userName: name }); persist({ userName: name }); },
  setUserEmail: (email) => { set({ userEmail: email }); persist({ userEmail: email }); },
  setUserBio: (bio) => { set({ userBio: bio }); persist({ userBio: bio }); },
  setUserPhone: (phone) => { set({ userPhone: phone }); persist({ userPhone: phone }); },
  setUserDob: (dob) => { set({ userDob: dob }); persist({ userDob: dob }); },
  setUserGender: (gender) => { set({ userGender: gender }); persist({ userGender: gender }); },
  setUserLocation: (location) => { set({ userLocation: location }); persist({ userLocation: location }); },
  setUserGenre: (genre) => { set({ userGenre: genre }); persist({ userGenre: genre }); },
  setUserCountry: (country) => { set({ userCountry: country }); persist({ userCountry: country }); },
  setAvatarId: (id) => { set({ avatarId: id }); persist({ avatarId: id }); },
  incrementLaunchCount: () => {
    const { launchCount } = get();
    const newVal = launchCount + 1;
    set({ launchCount: newVal });
    persist({ launchCount: newVal });
  },
  setHasRated: (rated) => { set({ hasRated: rated }); persist({ hasRated: rated }); },
  setLastSeenUpdateId: (id) => { set({ lastSeenUpdateId: id }); persist({ lastSeenUpdateId: id }); },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        set({
          themeMode: d.themeMode ?? DEFAULTS.themeMode,
          audioQuality: d.audioQuality ?? DEFAULTS.audioQuality,
          crossfadeEnabled: d.crossfadeEnabled ?? DEFAULTS.crossfadeEnabled,
          crossfadeDuration: d.crossfadeDuration ?? DEFAULTS.crossfadeDuration,
          gaplessEnabled: d.gaplessEnabled ?? DEFAULTS.gaplessEnabled,
          autoPlayEnabled: d.autoPlayEnabled ?? DEFAULTS.autoPlayEnabled,
          downloadOverWifiOnly: d.downloadOverWifiOnly ?? DEFAULTS.downloadOverWifiOnly,
          offlineMode: d.offlineMode ?? DEFAULTS.offlineMode,
          normalizeVolume: d.normalizeVolume ?? DEFAULTS.normalizeVolume,
          explicitContentFilter: d.explicitContentFilter ?? DEFAULTS.explicitContentFilter,
          userName: d.userName ?? DEFAULTS.userName,
          userEmail: d.userEmail ?? DEFAULTS.userEmail,
          userBio: d.userBio ?? DEFAULTS.userBio,
          userPhone: d.userPhone ?? DEFAULTS.userPhone,
          userDob: d.userDob ?? DEFAULTS.userDob,
          userGender: d.userGender ?? DEFAULTS.userGender,
          userLocation: d.userLocation ?? DEFAULTS.userLocation,
          userGenre: d.userGenre ?? DEFAULTS.userGenre,
          userCountry: d.userCountry ?? DEFAULTS.userCountry,
          avatarId: d.avatarId ?? DEFAULTS.avatarId,
          launchCount: d.launchCount ?? DEFAULTS.launchCount,
          hasRated: d.hasRated ?? DEFAULTS.hasRated,
          lastSeenUpdateId: d.lastSeenUpdateId ?? DEFAULTS.lastSeenUpdateId,
        });
      }
    } catch {}
  },

  resetSettings: async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      set(DEFAULTS);
    } catch {}
  },
}));

export function getQualityKbps(q: AudioQuality): string {
  switch (q) {
    case 'low': return '96kbps';
    case 'normal': return '160kbps';
    case 'high': return '320kbps';
  }
}
