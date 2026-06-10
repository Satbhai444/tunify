import { RNTP, isAvailable } from '../utils/nativePlayer';

export async function setupPlayer(): Promise<boolean> {
  if (!isAvailable || !RNTP) return false;
  
  try {
    const TrackPlayer = RNTP.default; const { Capability, AppKilledPlaybackBehavior } = RNTP;
    
    try {
      await TrackPlayer.setupPlayer();
    } catch(e) {}

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 2,
    });
    return true;
  } catch (e) {
    console.warn('[TrackPlayerService] Setup failed:', e);
    return false;
  }
}

export async function playbackService() {}
