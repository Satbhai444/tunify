export default async function PlaybackService() {
  console.log('[PlaybackService] INIT');

  const { isAvailable, RNTP } = require('../utils/nativePlayer');
  if (!isAvailable || !RNTP) return;
  const TrackPlayer = RNTP.default;

  const { usePlayerStore } = require('../stores/playerStore');

  try {
    TrackPlayer.addEventListener('remote-play', async () => {
      console.log('REMOTE PLAY TRIGGERED');
      console.log('TRACKPLAYER STATE:', await TrackPlayer.getState());
      usePlayerStore.getState().resume();
    });

    TrackPlayer.addEventListener('remote-pause', async () => {
      console.log('REMOTE PAUSE TRIGGERED');
      console.log('TRACKPLAYER STATE:', await TrackPlayer.getState());
      usePlayerStore.getState().pause();
    });

    TrackPlayer.addEventListener('remote-next', () => {
      console.log('REMOTE NEXT TRIGGERED');
      usePlayerStore.getState().skipNext();
    });

    TrackPlayer.addEventListener('remote-previous', () => {
      console.log('REMOTE PREV TRIGGERED');
      usePlayerStore.getState().skipPrevious();
    });

    TrackPlayer.addEventListener('remote-stop', () => {
      console.log('REMOTE STOP TRIGGERED');
      TrackPlayer.reset();
    });

    TrackPlayer.addEventListener('remote-seek', (event) => {
      console.log('REMOTE SEEK TRIGGERED', event.position);
      usePlayerStore.getState().seekTo(event.position);
    });
  } catch (e) {
    console.log('[PlaybackService] ERROR', e);
  }
}
