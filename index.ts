import { registerRootComponent } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import App from './App';

registerRootComponent(App);

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (true) {
  try {
    const TrackPlayer = require('react-native-track-player').default || require('react-native-track-player');
    TrackPlayer.registerPlaybackService(() => {
      const service = require('./src/services/PlaybackService');
      return service.default || service;
    });
  } catch (e) {
    console.warn('[Index] TrackPlayer service registration skipped:', e);
  }
}
