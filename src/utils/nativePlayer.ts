import { Platform } from 'react-native';
import TrackPlayer, { Capability, Event, State, AppKilledPlaybackBehavior, RepeatMode } from 'react-native-track-player';

export const isAvailable = true;
export const RNTP = {
  default: TrackPlayer,
  Capability,
  Event,
  State,
  AppKilledPlaybackBehavior,
  RepeatMode,
};
