import { RNTP, isAvailable } from '../utils/nativePlayer';

export const PlaybackService = async function() {
  if (!isAvailable || !RNTP) return;
  const { TrackPlayer, Event } = RNTP;

  // Lazy load store to prevent circular dependency at boot
  const { usePlayerStore } = require('../stores/playerStore');

  try {
    TrackPlayer.addEventListener(Event.RemotePlay, () => usePlayerStore.getState().togglePlayPause());
    TrackPlayer.addEventListener(Event.RemotePause, () => usePlayerStore.getState().togglePlayPause());
    TrackPlayer.addEventListener(Event.RemotePlayPause, () => usePlayerStore.getState().togglePlayPause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => usePlayerStore.getState().skipNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => usePlayerStore.getState().skipPrevious());
    
    // Fixed: Use reset() instead of destroy() for v4 compatibility
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
    
    TrackPlayer.addEventListener(Event.RemoteSeek, (event: any) => usePlayerStore.getState().seekTo(event.position));
    
    TrackPlayer.addEventListener(Event.RemoteJumpForward, (event: any) => {
      const interval = event.interval || 10;
      const { position, seekTo } = usePlayerStore.getState();
      seekTo(position + interval);
    });
    
    TrackPlayer.addEventListener(Event.RemoteJumpBackward, (event: any) => {
      const interval = event.interval || 10;
      const { position, seekTo } = usePlayerStore.getState();
      seekTo(Math.max(0, position - interval));
    });
    
    TrackPlayer.addEventListener(Event.RemoteDuck, (event: any) => {
      const { togglePlayPause, isPlaying } = usePlayerStore.getState();
      if (event.permanent || event.paused) {
        if (isPlaying) togglePlayPause();
      } else {
        if (!isPlaying) togglePlayPause();
      }
    });
  } catch (e) {
    if (__DEV__) console.log('[PlaybackService] Event registration failed');
  }
};
