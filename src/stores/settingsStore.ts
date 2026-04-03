import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'tunify_settings';

export type AudioQuality = 'low' | 'normal' | 'high';

export interface SettingsState {
  audioQuality: AudioQuality;
  crossfadeEnabled: boolean;
  crossfadeDuration: number; // seconds
  gaplessEnabled: boolean;
  autoPlayEnabled: boolean;
  downloadOverWifiOnly: boolean;
  offlineMode: boolean;
  normalizeVolume: boolean;
  explicitContentFilter: boolean;
  userName: string;
  userEmail: string;

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

export const useSettingsStore = create<SettingsState>((set) => ({
  audioQuality: 'normal',
  crossfadeEnabled: false,
  crossfadeDuration: 5,
  gaplessEnabled: true,
  autoPlayEnabled: true,
  downloadOverWifiOnly: true,
  offlineMode: false,
  normalizeVolume: false,
  explicitContentFilter: false,
  userName: 'Tunify User',
  userEmail: 'user@tunify.app',

  setAudioQuality: (q) => {
    set({ audioQuality: q });
    persist({ audioQuality: q });
  },
  setCrossfade: (enabled) => {
    set({ crossfadeEnabled: enabled });
    persist({ crossfadeEnabled: enabled });
  },
  setCrossfadeDuration: (seconds) => {
    set({ crossfadeDuration: seconds });
    persist({ crossfadeDuration: seconds });
  },
  setGapless: (enabled) => {
    set({ gaplessEnabled: enabled });
    persist({ gaplessEnabled: enabled });
  },
  setAutoPlay: (enabled) => {
    set({ autoPlayEnabled: enabled });
    persist({ autoPlayEnabled: enabled });
  },
  setDownloadOverWifiOnly: (enabled) => {
    set({ downloadOverWifiOnly: enabled });
    persist({ downloadOverWifiOnly: enabled });
  },
  setOfflineMode: (enabled) => {
    set({ offlineMode: enabled });
    persist({ offlineMode: enabled });
  },
  setNormalizeVolume: (enabled) => {
    set({ normalizeVolume: enabled });
    persist({ normalizeVolume: enabled });
  },
  setExplicitContentFilter: (enabled) => {
    set({ explicitContentFilter: enabled });
    persist({ explicitContentFilter: enabled });
  },
  setUserName: (name) => {
    set({ userName: name });
    persist({ userName: name });
  },
  setUserEmail: (email) => {
    set({ userEmail: email });
    persist({ userEmail: email });
  },
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          audioQuality: data.audioQuality ?? 'normal',
          crossfadeEnabled: data.crossfadeEnabled ?? false,
          crossfadeDuration: data.crossfadeDuration ?? 5,
          gaplessEnabled: data.gaplessEnabled ?? true,
          autoPlayEnabled: data.autoPlayEnabled ?? true,
          downloadOverWifiOnly: data.downloadOverWifiOnly ?? true,
          offlineMode: data.offlineMode ?? false,
          normalizeVolume: data.normalizeVolume ?? false,
          explicitContentFilter: data.explicitContentFilter ?? false,
          userName: data.userName ?? 'Tunify User',
          userEmail: data.userEmail ?? 'user@tunify.app',
        });
      }
    } catch {}
  },
  resetSettings: async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      set({
        audioQuality: 'normal',
        crossfadeEnabled: false,
        crossfadeDuration: 5,
        gaplessEnabled: true,
        autoPlayEnabled: true,
        downloadOverWifiOnly: true,
        offlineMode: false,
        normalizeVolume: false,
        explicitContentFilter: false,
        userName: 'Tunify User',
        userEmail: 'user@tunify.app',
      });
    } catch {}
  },
}));

// Quality to kbps mapping used by jiosaavn normalizer
export function getQualityKbps(q: AudioQuality): string {
  switch (q) {
    case 'low': return '96kbps';
    case 'normal': return '160kbps';
    case 'high': return '320kbps';
  }
}
