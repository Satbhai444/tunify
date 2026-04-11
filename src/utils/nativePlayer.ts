import { Platform } from 'react-native';

let TrackPlayer: any = {};
let Event: any = {};
let State: any = {};
let RepeatMode: any = {};
let isActuallyAvailable = false;

if (Platform.OS !== 'web') {
  try {
    const RNTP = require('react-native-track-player');
    TrackPlayer = RNTP.default || RNTP;
    Event = RNTP.Event;
    State = RNTP.State;
    RepeatMode = RNTP.RepeatMode;
    isActuallyAvailable = true;
  } catch (e) {
    console.log('[NativePlayer] TrackPlayer not loaded');
  }
}

export const RNTP = {
  TrackPlayer,
  Event,
  State,
  RepeatMode,
  AppKilledPlaybackBehavior: { StopPlayback: 'stop_playback' },
};

export const isAvailable = isActuallyAvailable;
