import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Track } from '../types';
import { setupWebMediaSession, updateWebPlaybackState, updateWebPositionState, setupMediaControls, syncMediaPlaybackState } from '../services/mediaControls';
import { createWebAudioPlayer } from '../utils/webAudio';
import * as NativePlayer from '../utils/nativePlayer';

// ─── Audio Engine Detection ───
// Force disable TrackPlayer for now to ensure stability in Expo Go
const { RNTP, isAvailable } = NativePlayer;
let TrackPlayer: any = null;
let Capability: any = null;
let RNTPEvent: any = null;
let RNTPState: any = null;
let RepeatMode: any = null;
let AppKilledPlaybackBehavior: any = null;
let isTrackPlayerAvailable = isAvailable; console.log("[PlayerStore Debug] Capability:", !!Capability, "CapabilityKeys:", Object.keys(RNTP?.Capability || {}), "Event:", !!RNTPEvent, "EventKeys:", Object.keys(RNTP?.Event || {})); console.log("[PlayerStore] isTrackPlayerAvailable:", isTrackPlayerAvailable, "RNTP:", !!RNTP);

if (isTrackPlayerAvailable && RNTP) {
  TrackPlayer = RNTP.default;
  Capability = RNTP.Capability;
  RNTPEvent = RNTP.Event;
  RNTPState = RNTP.State;
  RepeatMode = RNTP.RepeatMode;
  AppKilledPlaybackBehavior = RNTP.AppKilledPlaybackBehavior;
}

let createAudioPlayer: ((url: string) => any) | null = null;
let setAudioModeAsync: ((mode: any) => Promise<void>) | null = null;
let isExpoAudioAvailable = false;

try {
  const expoAudio = require('expo-audio');
  createAudioPlayer = expoAudio.createAudioPlayer;
  setAudioModeAsync = expoAudio.setAudioModeAsync;
  isExpoAudioAvailable = true;
  console.log('[Player] ✅ Using expo-audio (Safe Mode)');
} catch (e) {
  console.warn('[Player] ❌ expo-audio not available');
}

let expoPlayer: any = null;
let statusSubscription: { remove: () => void } | null = null;
let positionTimer: ReturnType<typeof setInterval> | null = null;
let sleepTimer: ReturnType<typeof setInterval> | null = null;
let isTransitioning = false;
let isInitialized = false;
let isSeeking = false;

async function configureExpoAudio() {
  if (!setAudioModeAsync) return;
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
    });
  } catch (e) {}
}

function startPositionTracking() {
  if (positionTimer) clearInterval(positionTimer);
  positionTimer = setInterval(async () => {
    try {
      const store = usePlayerStore.getState();
      if (isSeeking) return;

      let pos = 0;
      let dur = 0;

      if (isTrackPlayerAvailable && TrackPlayer) {
        const progress = await TrackPlayer.getProgress();
        pos = progress.position;
        dur = progress.duration;
      } else if (expoPlayer) {
        pos = expoPlayer.currentTime ?? 0;
        dur = expoPlayer.duration ?? 0;
      }

      if (Math.abs(pos - store.position) > 0.5) {
        usePlayerStore.setState({ position: pos });
      }
      if (dur > 0 && dur !== store.duration) {
        usePlayerStore.setState({ duration: dur });
      }
    } catch {}
  }, 500);
}

async function loadAndPlay(track: Track) {
  isTransitioning = true;
  usePlayerStore.setState({ isBuffering: true, position: 0, duration: 0 });

  if (isTrackPlayerAvailable && TrackPlayer) {
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add([
        { id: 'dummy_prev', url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/88/ab/0588ab4a-0a4a-1ab1-b556-91e84a29a59c/mzaf_10332832876646849405.plus.aac.p.m4a', title: 'prev', artist: '...' },
        {
          id: track.id,
          url: (track as any).localPath || track.url,
          title: track.title,
          artist: track.artist,
          artwork: track.artwork,
          duration: track.duration,
        },
        { id: 'dummy_next', url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/05/88/ab/0588ab4a-0a4a-1ab1-b556-91e84a29a59c/mzaf_10332832876646849405.plus.aac.p.m4a', title: 'next', artist: '...' }
      ]);
      await TrackPlayer.skip(1);
      const { repeatMode } = usePlayerStore.getState();
      if (RepeatMode) {
        await TrackPlayer.setRepeatMode(repeatMode === 'one' ? RepeatMode.Track : RepeatMode.Off);
      }
      await TrackPlayer.play();
      startPositionTracking();
      usePlayerStore.setState({ isPlaying: true, isBuffering: false });
    } catch (e) {
      console.error('[RNTP] Playback error:', e);
    }
  } else if (createAudioPlayer) {
    try {
      if (statusSubscription) { try { statusSubscription.remove(); } catch {} statusSubscription = null; }
      if (expoPlayer) { try { expoPlayer.pause(); expoPlayer.remove(); } catch {} expoPlayer = null; }
      if (positionTimer) { clearInterval(positionTimer); positionTimer = null; }

      const playUrl = (track as any).localPath || track.url;
      expoPlayer = createAudioPlayer(playUrl);

      statusSubscription = expoPlayer.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish && !isTransitioning) {
          usePlayerStore.getState().skipNext();
        }
      });

      const { repeatMode } = usePlayerStore.getState();
      expoPlayer.loop = repeatMode === 'one';
      expoPlayer.play();

      startPositionTracking();
      usePlayerStore.setState({ isPlaying: true, isBuffering: false });
      
      setupMediaControls(expoPlayer, track, {
        onPlay: () => usePlayerStore.getState().resume(),
        onPause: () => usePlayerStore.getState().pause(),
        onNextTrack: () => usePlayerStore.getState().skipNext(),
        onPreviousTrack: () => usePlayerStore.getState().skipPrevious(),
        onSeekForward: () => usePlayerStore.getState().seekTo(usePlayerStore.getState().position + 10),
        onSeekBackward: () => usePlayerStore.getState().seekTo(Math.max(0, usePlayerStore.getState().position - 10)),
      });
    } catch (e) {
      console.error('[ExpoAudio] Playback error:', e);
      usePlayerStore.setState({ isPlaying: false, isBuffering: false });
    }
  }
  
  isTransitioning = false;
}

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
  isPlayerReady: boolean;
  sleepTimerRemaining: number | null;

  initPlayer: () => Promise<void>;
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (tracks: Track[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setPlayerReady: (ready: boolean) => void;

  play: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  addToQueue: (track: Track) => Promise<void>;
  applyEqPreset: (preset: 'flat' | 'bass' | 'treble' | 'vocal') => void;
  setSleepTimer: (minutes: number | null) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,
  repeatMode: 'off',
  isShuffled: false,
  isPlayerReady: false,
  sleepTimerRemaining: null,

  initPlayer: async () => {
    if (isInitialized) return;
    if (Platform.OS === 'web') {
      set({ isPlayerReady: true });
      isInitialized = true;
      return;
    }
    
    if (isTrackPlayerAvailable && TrackPlayer) {
      const { setupPlayer } = require('../services/trackPlayerService');
      const ready = await setupPlayer();
      
      TrackPlayer.addEventListener(RNTPEvent.PlaybackState, (event: any) => {
        if (event.state === RNTPState.Playing) set({ isPlaying: true, isBuffering: false });
        if (event.state === RNTPState.Paused) set({ isPlaying: false, isBuffering: false });
        if (event.state === RNTPState.Buffering) set({ isBuffering: true });
      });

      TrackPlayer.addEventListener(RNTPEvent.PlaybackQueueEnded, () => {
        get().skipNext();
      });

      set({ isPlayerReady: ready });
    } else {
      await configureExpoAudio();
      set({ isPlayerReady: true });
    }
    isInitialized = true;
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (tracks) => set({ queue: tracks }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),

  toggleRepeat: async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = get().repeatMode === 'off' ? 'all' : get().repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
    
    if (isTrackPlayerAvailable && TrackPlayer && RepeatMode) {
      await TrackPlayer.setRepeatMode(next === 'one' ? RepeatMode.Track : RepeatMode.Off);
    } else if (expoPlayer) {
      expoPlayer.loop = next === 'one';
    }
  },

  toggleShuffle: async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { isShuffled, queue, originalQueue, currentTrack } = get();
    if (!isShuffled) {
      const others = queue.filter(t => t.id !== currentTrack?.id).sort(() => Math.random() - 0.5);
      set({ isShuffled: true, queue: currentTrack ? [currentTrack, ...others] : others, originalQueue: queue });
    } else {
      set({ isShuffled: false, queue: originalQueue.length > 0 ? originalQueue : queue });
    }
  },

  play: async (track, queue) => {
    const state = get();
    if (!state.isPlayerReady) await state.initPlayer();
    const tracksToQueue = queue ?? [track];
    set({ currentTrack: track, queue: tracksToQueue, originalQueue: tracksToQueue, isShuffled: false });
    await loadAndPlay(track);
  },

  togglePlayPause: async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentlyPlaying = get().isPlaying;
    set({ isPlaying: !currentlyPlaying });
    syncMediaPlaybackState(!currentlyPlaying);

    if (isTrackPlayerAvailable && TrackPlayer) {
      if (currentlyPlaying) await TrackPlayer.pause();
      else await TrackPlayer.play();
    } else if (expoPlayer) {
      if (currentlyPlaying) expoPlayer.pause();
      else expoPlayer.play();
    }
  },

  pause: async () => { 
    if (isTrackPlayerAvailable && TrackPlayer) await TrackPlayer.pause();
    else if (expoPlayer) expoPlayer.pause(); 
    set({ isPlaying: false }); syncMediaPlaybackState(false); 
  },
  
  resume: async () => { 
    if (isTrackPlayerAvailable && TrackPlayer) await TrackPlayer.play();
    else if (expoPlayer) expoPlayer.play(); 
    set({ isPlaying: true }); syncMediaPlaybackState(true); 
  },

  skipNext: async () => {
    const { queue, currentTrack, repeatMode } = get();
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    let next: Track | null = null;
    if (idx >= 0 && idx < queue.length - 1) next = queue[idx + 1];
    else if (repeatMode === 'all' && queue.length > 0) next = queue[0];
    if (next) {
      set({ currentTrack: next });
      await loadAndPlay(next);
    }
  },

  skipPrevious: async () => {
    const { queue, currentTrack, position } = get();
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    if (position > 3) {
      if (isTrackPlayerAvailable && TrackPlayer) await TrackPlayer.seekTo(0);
      else if (expoPlayer) try { await expoPlayer.seekTo(0); } catch {}
      set({ position: 0 });
      return;
    }
    if (idx > 0) {
      const prev = queue[idx - 1];
      set({ currentTrack: prev });
      await loadAndPlay(prev);
    }
  },

  seekTo: async (seconds) => {
    isSeeking = true;
    set({ position: seconds });
    if (expoPlayer) {
      try { 
        await expoPlayer.seekTo(seconds); 
      } catch {}
    }
    setTimeout(() => { isSeeking = false; }, 800); // give time for player to catch up
  },

  addToQueue: async (track) => {
    set(state => ({ queue: [...state.queue, track], originalQueue: [...state.originalQueue, track] }));
  },

  applyEqPreset: (preset) => {
    if (!expoPlayer) return;
    try {
      expoPlayer.playbackRate = preset === 'bass' ? 0.97 : 1.0;
    } catch {}
  },

  setSleepTimer: (minutes) => {
    if (sleepTimer) clearInterval(sleepTimer);
    if (minutes === null) { set({ sleepTimerRemaining: null }); return; }
    let remaining = minutes * 60;
    set({ sleepTimerRemaining: remaining });
    sleepTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(sleepTimer!);
        set({ sleepTimerRemaining: null });
        get().pause();
      } else set({ sleepTimerRemaining: remaining });
    }, 1000);
  },
}));
