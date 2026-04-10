import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
import { Platform } from 'react-native';
import { RNTP, isAvailable } from './src/utils/nativePlayer';
import { PlaybackService } from './src/services/PlaybackService';

registerRootComponent(App);

if (Platform.OS !== 'web' && isAvailable && RNTP) {
  const { TrackPlayer } = RNTP;
  try {
    if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
      TrackPlayer.registerPlaybackService(() => PlaybackService);
      console.log('[Entry] ✅ TrackPlayer playback service registered');
    }
  } catch (e) {
    console.log('[Entry] ⚠️ TrackPlayer registration skipped');
  }
}
