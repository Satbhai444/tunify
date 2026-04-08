/**
 * Platform-safe wrappers for native-only modules.
 * On web these become no-ops or use browser equivalents.
 */

import { Platform } from 'react-native';

/* ─────────────── Haptics ─────────────── */

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

const IMPACT_MAP: Record<string, any> = {};
const NOTIFICATION_MAP: Record<string, any> = {};

let HapticsModule: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  try {
    HapticsModule = require('expo-haptics');
    IMPACT_MAP.light = HapticsModule!.ImpactFeedbackStyle.Light;
    IMPACT_MAP.medium = HapticsModule!.ImpactFeedbackStyle.Medium;
    IMPACT_MAP.heavy = HapticsModule!.ImpactFeedbackStyle.Heavy;
    NOTIFICATION_MAP.success = HapticsModule!.NotificationFeedbackType.Success;
    NOTIFICATION_MAP.warning = HapticsModule!.NotificationFeedbackType.Warning;
    NOTIFICATION_MAP.error = HapticsModule!.NotificationFeedbackType.Error;
  } catch {
    HapticsModule = null;
  }
}

export const haptics = {
  impact(style: ImpactStyle = 'medium') {
    if (HapticsModule) {
      HapticsModule.impactAsync(IMPACT_MAP[style] ?? IMPACT_MAP.medium);
    }
  },
  notification(type: NotificationType = 'success') {
    if (HapticsModule) {
      HapticsModule.notificationAsync(NOTIFICATION_MAP[type] ?? NOTIFICATION_MAP.success);
    }
  },
  selection() {
    if (HapticsModule) {
      HapticsModule.selectionAsync();
    }
  },
};

/* ─────────────── File System (download) ─────────────── */

export async function downloadTrack(
  url: string,
  trackId: string,
  title: string,
): Promise<{ uri: string; size: number } | null> {
  if (Platform.OS === 'web') {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.mp3`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { uri: url, size: 0 };
    } catch {
      return null;
    }
  }

  // Native: use expo-file-system
  try {
    const FileSystem = require('expo-file-system');
    const downloadsDir = `${FileSystem.documentDirectory}tunify_downloads/`;
    
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
    }

    const safeTitle = title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
    const fileName = `${trackId.replace(/[^a-zA-Z0-9_]/g, '_')}_${safeTitle}.mp3`;
    const fileUri = `${downloadsDir}${fileName}`;

    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    const info = await FileSystem.getInfoAsync(uri);
    
    return { 
      uri, 
      size: (info as any).size || 0 
    };
  } catch (e) {
    console.warn('Download failed:', e);
    return null;
  }
}
