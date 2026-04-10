import { RNTP, isAvailable } from '../utils/nativePlayer';

export const PlaybackService = async function() {
  if (!isAvailable || !RNTP) return;
  const { TrackPlayer, Event } = RNTP;

  try {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
    TrackPlayer.addEventListener(Event.RemoteSeek, (event: any) => TrackPlayer.seekTo(event.position));
    TrackPlayer.addEventListener(Event.RemoteJumpForward, (event: any) => {
      const interval = event.interval || 10;
      TrackPlayer.getPosition().then((pos: number) => TrackPlayer.seekTo(pos + interval));
    });
    TrackPlayer.addEventListener(Event.RemoteJumpBackward, (event: any) => {
      const interval = event.interval || 10;
      TrackPlayer.getPosition().then((pos: number) => TrackPlayer.seekTo(Math.max(0, pos - interval)));
    });
  } catch (e) {
    console.log('[PlaybackService] Event registration failed');
  }
};
