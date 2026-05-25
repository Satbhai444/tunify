import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Track } from '../types';
import { setupWebMediaSession, updateWebPlaybackState, updateWebPositionState } from '../services/mediaControls';
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
let isTrackPlayerAvailable = false; // FORCED FALSE

let createAudioPlayer: ((url: string) => any) | null = null;
let setAudioModeAsync: ((mode: any) => Promise<void>) | null = null;
let isExpoAudioAvailable = false;

// expo-audio setup
try {
  const expoAudio = require('expo-audio');
  createAudioPlayer = expoAudio.createAudioPlayer;
  setAudioModeAsync = expoAudio.setAudioModeAsync;
  isExpoAudioAvailable = true;
  console.log('[Player] ✅ Using expo-audio (Safe Mode)');
} catch (e) {
  console.warn('[Player] ❌ expo-audio not available');
}

// ─── Global State Variables ───
let expoPlayer: any = null;
let statusSubscription: { remove: () => void } | null = null;
let positionTimer: ReturnType<typeof setInterval> | null = null;
let sleepTimer: ReturnType<typeof setInterval> | null = null;
let isTransitioning = false;
let isInitialized = false;

async function configureExpoAudio() {
  if (!setAudioModeAsync) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  } catch (e) {
    console.warn('[ExpoAudio] Config error:', e);
  }
}

function startExpoPositionTracking() {
  if (positionTimer) clearInterval(positionTimer);
  positionTimer = setInterval(() => {
    if (!expoPlayer) return;
    try {
      const pos = expoPlayer.currentTime ?? 0;
      const dur = expoPlayer.duration ?? 0;
      const store = usePlayerStore.getState();
      if (Math.abs(pos - store.position) > 0.5) {
        usePlayerStore.setState({ position: pos });
      }
      if (dur > 0 && dur !== store.duration) {
        usePlayerStore.setState({ duration: dur });
      }
    } catch {}
  }, 500);
}

async function loadAndPlayWithExpoAudio(track: Track) {
  if (!createAudioPlayer) return;
  isTransitioning = true;
  usePlayerStore.setState({ isBuffering: true, position: 0, duration: 0 });

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

    startExpoPositionTracking();
    usePlayerStore.setState({ isPlaying: true, isBuffering: false });
    isTransitioning = false;
  } catch (e) {
    console.error('[ExpoAudio] Playback error:', e);
    usePlayerStore.setState({ isPlaying: false, isBuffering: false });
    isTransitioning = false;
  }
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
    await configureExpoAudio();
    set({ isPlayerReady: true });
    isInitialized = true;
    console.log('[PlayerStore] 🚀 Safe Init Success');
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
    if (expoPlayer) expoPlayer.loop = next === 'one';
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
    await loadAndPlayWithExpoAudio(track);
  },

  togglePlayPause: async () => {
    if (!expoPlayer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentlyPlaying = expoPlayer.playing;
    
    // Immediate state update for UI responsiveness
    set({ isPlaying: !currentlyPlaying });

    if (currentlyPlaying) {
      expoPlayer.pause();
    } else {
      expoPlayer.play();
    }
  },

  pause: async () => { if (expoPlayer) expoPlayer.pause(); set({ isPlaying: false }); },
  resume: async () => { if (expoPlayer) expoPlayer.play(); set({ isPlaying: true }); },

  skipNext: async () => {
    const { queue, currentTrack, repeatMode } = get();
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    let next: Track | null = null;
    if (idx >= 0 && idx < queue.length - 1) next = queue[idx + 1];
    else if (repeatMode === 'all' && queue.length > 0) next = queue[0];
    if (next) {
      set({ currentTrack: next });
      await loadAndPlayWithExpoAudio(next);
    }
  },

  skipPrevious: async () => {
    const { queue, currentTrack, position } = get();
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    if (position > 3 && expoPlayer) {
      try { await expoPlayer.seekTo(0); set({ position: 0 }); } catch {}
      return;
    }
    if (idx > 0) {
      const prev = queue[idx - 1];
      set({ currentTrack: prev });
      await loadAndPlayWithExpoAudio(prev);
    }
  },

  seekTo: async (seconds) => {
    set({ position: seconds });
    if (expoPlayer) try { await expoPlayer.seekTo(seconds); } catch {}
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
