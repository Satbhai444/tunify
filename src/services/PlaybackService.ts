import { RNTP, isAvailable } from '../utils/nativePlayer';
import { usePlayerStore } from '../stores/playerStore';

export const PlaybackService = async function() {
  if (!isAvailable || !RNTP) return;
  const { TrackPlayer, Event } = RNTP;

  try {
    TrackPlayer.addEventListener(Event.RemotePlay, () => usePlayerStore.getState().togglePlayPause());
    TrackPlayer.addEventListener(Event.RemotePause, () => usePlayerStore.getState().togglePlayPause());
    TrackPlayer.addEventListener(Event.RemotePlayPause, () => usePlayerStore.getState().togglePlayPause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => usePlayerStore.getState().skipNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => usePlayerStore.getState().skipPrevious());
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
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
