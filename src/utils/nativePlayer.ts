import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let trackPlayerInstance = null;
let isAvailableFlag = false;

if (true) {
  try {
    trackPlayerInstance = require('react-native-track-player').default || require('react-native-track-player');
    isAvailableFlag = true;
  } catch (e) {
    console.warn('[NativePlayer] Failed to load react-native-track-player:', e);
  }
}

export const isAvailable = isAvailableFlag;
export const RNTP = trackPlayerInstance;
