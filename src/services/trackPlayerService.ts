import { RNTP, isAvailable } from '../utils/nativePlayer';

export async function setupPlayer(): Promise<boolean> {
  if (!isAvailable || !RNTP) return false;
  
  try {
    const { TrackPlayer, Capability, AppKilledPlaybackBehavior } = RNTP;
    
    // We only need updateOptions here, because RNTP setupPlayer is typically called
    // at the root, or we can just configure options so the media session has buttons.
    // If not set up, it will throw, but it's safe if handled.
    try {
      await TrackPlayer.setupPlayer();
    } catch(e) {
      // Already setup
    }

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
      progressUpdateEventInterval: 2,
    });
    return true;
  } catch (e) {
    console.warn('[TrackPlayerService] Setup failed:', e);
    return false;
  }
}

export async function playbackService() {
  // Handled in index.ts via PlaybackService.ts
}
