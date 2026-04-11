import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// 1. Setup TrackPlayer Service (Must be early for Native)
if (Platform.OS !== 'web') {
  try {
    const TrackPlayer = require('react-native-track-player');
    const { PlaybackService } = require('./src/services/PlaybackService');
    
    // Register the service
    TrackPlayer.registerPlaybackService(() => PlaybackService);
    console.log('[Entry] ✅ Service Registered');
  } catch (e) {
    if (__DEV__) console.log('[Entry] ⚠️ Service skipped');
  }
}

// 2. Register Root Component
registerRootComponent(App);
