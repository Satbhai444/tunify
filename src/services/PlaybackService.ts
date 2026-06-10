import { isAvailable, RNTP } from '../utils/nativePlayer';

export default async function PlaybackService() {
  console.log('[PlaybackService] Initialized!');
  if (!isAvailable || !RNTP) return;
  const TrackPlayer = RNTP.default;

  // Lazy load store
  const { usePlayerStore } = require('../stores/playerStore');

  try {
    TrackPlayer.addEventListener('remote-play', () => {
      console.log('[PlaybackService] REMOTE PLAY');
      usePlayerStore.getState().resume();
    });
    
    TrackPlayer.addEventListener('remote-pause', () => {
      console.log('[PlaybackService] REMOTE PAUSE');
      usePlayerStore.getState().pause();
    });

    TrackPlayer.addEventListener('remote-next', () => {
      console.log('[PlaybackService] REMOTE NEXT');
      usePlayerStore.getState().skipNext();
    });

    TrackPlayer.addEventListener('remote-previous', () => {
      console.log('[PlaybackService] REMOTE PREVIOUS');
      usePlayerStore.getState().skipPrevious();
    });

    TrackPlayer.addEventListener('remote-stop', () => {
      console.log('[PlaybackService] REMOTE STOP');
      TrackPlayer.reset();
    });

    TrackPlayer.addEventListener('remote-seek', (event: any) => {
      console.log('[PlaybackService] REMOTE SEEK', event.position);
      usePlayerStore.getState().seekTo(event.position);
    });

  } catch (e) {
    console.log('[PlaybackService] Event registration failed', e);
  }
}
