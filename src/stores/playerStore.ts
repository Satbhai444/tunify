import { create } from 'zustand';
import { Platform } from 'react-native';
import { Track } from '../types';
import { setupWebMediaSession, updateWebPlaybackState, updateWebPositionState } from '../services/mediaControls';
import { createWebAudioPlayer } from '../utils/webAudio';

// ─── Audio Engine Detection ───
// Try TrackPlayer first (native build), fall back to expo-audio (Expo Go)
let TrackPlayer: any = null;
let Capability: any = null;
let RNTPEvent: any = null;
let RNTPState: any = null;
let RepeatMode: any = null;
let isTrackPlayerAvailable = false;

let createAudioPlayer: ((url: string) => any) | null = null;
let setAudioModeAsync: ((mode: any) => Promise<void>) | null = null;
let isExpoAudioAvailable = false;

if (Platform.OS !== 'web') {
  // Try TrackPlayer first
  try {
    const rntp = require('react-native-track-player');
    TrackPlayer = rntp.default;
    Capability = rntp.Capability;
    RNTPEvent = rntp.Event;
    RNTPState = rntp.State;
    RepeatMode = rntp.RepeatMode;
    // Quick validation — if native module isn't linked, this will throw
    if (TrackPlayer && typeof TrackPlayer.setupPlayer === 'function') {
      isTrackPlayerAvailable = true;
      console.log('[Player] ✅ Using react-native-track-player (Native Build)');
    }
  } catch (e) {
    console.log('[Player] ⚠️ TrackPlayer not available, falling back to expo-audio (Expo Go mode)');
  }

  // Fallback to expo-audio if TrackPlayer not available
  if (!isTrackPlayerAvailable) {
    try {
      const expoAudio = require('expo-audio');
      createAudioPlayer = expoAudio.createAudioPlayer;
      setAudioModeAsync = expoAudio.setAudioModeAsync;
      isExpoAudioAvailable = true;
      console.log('[Player] ✅ Using expo-audio (Expo Go mode)');
    } catch (e) {
      console.warn('[Player] ❌ expo-audio also not available:', e);
    }
  }
}

// ─── expo-audio state ───
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
        updateWebPositionState(pos, dur);
      }
      if (dur > 0 && dur !== store.duration) {
        usePlayerStore.setState({ duration: dur });
      }
    } catch {}
  }, 500);
}

function startTrackPlayerPositionTracking() {
  if (positionTimer) clearInterval(positionTimer);
  positionTimer = setInterval(async () => {
    if (!isTrackPlayerAvailable) return;
    try {
      const pbState = await TrackPlayer.getPlaybackState();
      // Only poll if we are actually playing
      if (pbState.state !== RNTPState.Playing) return;

      const pos = await TrackPlayer.getPosition();
      const dur = await TrackPlayer.getDuration();
      const store = usePlayerStore.getState();
      
      if (Math.abs(pos - store.position) > 0.3) {
        usePlayerStore.setState({ position: pos });
      }
      if (dur > 0 && Math.abs(dur - store.duration) > 1) {
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
    // Cleanup old
    if (statusSubscription) { try { statusSubscription.remove(); } catch {} statusSubscription = null; }
    if (expoPlayer) { try { expoPlayer.pause(); expoPlayer.remove(); } catch {} expoPlayer = null; }
    if (positionTimer) { clearInterval(positionTimer); positionTimer = null; }

    const playUrl = (track as any).localPath || track.url;
    expoPlayer = createAudioPlayer(playUrl);

    statusSubscription = expoPlayer.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish && !isTransitioning) {
        usePlayerStore.getState().skipNext();
      }
      if (status.isBuffering !== undefined) {
        usePlayerStore.setState({ isBuffering: status.isBuffering });
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

// ─── Store ───
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

    if (isTrackPlayerAvailable) {
      try {
        await TrackPlayer.setupPlayer({ waitForBuffer: true });
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play, Capability.Pause,
            Capability.SkipToNext, Capability.SkipToPrevious,
            Capability.Stop, Capability.SeekTo,
            Capability.JumpForward, Capability.JumpBackward,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
          notificationCapabilities: [
            Capability.Play, Capability.Pause,
            Capability.SkipToNext, Capability.SkipToPrevious,
            Capability.JumpForward, Capability.JumpBackward,
          ],
        });

        TrackPlayer.addEventListener(RNTPEvent.PlaybackState, (event: any) => {
          // In RNTP v4, state can be a string or part of an object depending on the hook
          const state = typeof event.state === 'string' ? event.state : event.state;
          console.log('[PlayerStore] State Changed:', state);
          set({ 
            isPlaying: state === RNTPState.Playing || state === 'playing',
            isBuffering: state === RNTPState.Buffering || state === RNTPState.Loading || state === 'buffering' || state === 'loading'
          });
        });

        TrackPlayer.addEventListener(RNTPEvent.PlaybackActiveTrackChanged, (event: any) => {
          console.log('[PlayerStore] Track Changed:', event.track?.title);
          if (event.track) {
            const track = event.track as unknown as Track;
            set({ currentTrack: track, duration: event.track.duration || 0 });
            try {
              const { useLibraryStore } = require('./libraryStore');
              useLibraryStore.getState().addRecentlyPlayed(track);
            } catch {}
          }
        });

        TrackPlayer.addEventListener(RNTPEvent.PlaybackProgressUpdated, (event: any) => {
          // Only update if we aren't using the polling timer (or as a fallback)
          set({ position: event.position, duration: event.duration });
        });

        set({ isPlayerReady: true });
        isInitialized = true;
      } catch (e) {
        console.error('[TrackPlayer] Init error:', e);
        set({ isPlayerReady: true });
        isInitialized = true;
      }
    } else {
      // expo-audio mode
      await configureExpoAudio();
      set({ isPlayerReady: true });
      isInitialized = true;
    }
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (tracks) => set({ queue: tracks }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),

  toggleRepeat: async () => {
    const current = get().repeatMode;
    const next = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
    if (isTrackPlayerAvailable) {
      const mode = next === 'off' ? RepeatMode.Off : next === 'one' ? RepeatMode.Track : RepeatMode.Queue;
      await TrackPlayer.setRepeatMode(mode);
    } else if (expoPlayer) {
      expoPlayer.loop = next === 'one';
    }
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentTrack } = get();
    if (!isShuffled) {
      const shuffled = [...queue.filter(t => t.id !== currentTrack?.id)].sort(() => Math.random() - 0.5);
      const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      set({ isShuffled: true, queue: newQueue, originalQueue: queue });
    } else {
      set({ isShuffled: false, queue: originalQueue.length > 0 ? originalQueue : queue });
    }
  },

  play: async (track, queue) => {
    const state = get();
    if (!state.isPlayerReady) await state.initPlayer();

    const tracksToQueue = queue ?? [track];
    set({ currentTrack: track, queue: tracksToQueue, originalQueue: tracksToQueue, isShuffled: false });

    try {
      const { useLibraryStore } = require('./libraryStore');
      useLibraryStore.getState().addRecentlyPlayed(track);
    } catch {}

    if (Platform.OS === 'web') {
      // Web player
      setupWebMediaSession(track, {
        onPlay: () => get().togglePlayPause(),
        onPause: () => get().togglePlayPause(),
        onNextTrack: () => get().skipNext(),
        onPreviousTrack: () => get().skipPrevious(),
        onSeekForward: () => get().seekTo(get().position + 10),
        onSeekBackward: () => get().seekTo(get().position - 10),
      });
      set({ isPlaying: true, isBuffering: false });
    } else if (isTrackPlayerAvailable) {
      // Native TrackPlayer
      const tnTracks = tracksToQueue.map(t => ({
        ...t,
        url: (t as any).localPath || t.url,
      }));
      await TrackPlayer.reset();
      if (idx >= 0) {
        await TrackPlayer.skip(idx);
      }
      setTimeout(async () => {
        await TrackPlayer.play();
      }, 200);
      set({ isPlaying: true, isBuffering: false }); // Eager UI update
      startTrackPlayerPositionTracking();
    } else {
      // expo-audio fallback (Expo Go)
      await loadAndPlayWithExpoAudio(track);
    }
  },

  togglePlayPause: async () => {
    console.log('[PlayerStore] togglePlayPause hit');
    if (isTrackPlayerAvailable) {
      try {
        const pbStateInner = await TrackPlayer.getPlaybackState();
        const stateStr = pbStateInner.state === RNTPState.Playing ? 'Playing' : 'Paused/Other';
        console.log('[PlayerStore] Native State:', stateStr, pbStateInner.state);
        
        if (pbStateInner.state === RNTPState.Playing || pbStateInner.state === 'playing') {
          await TrackPlayer.pause();
          set({ isPlaying: false }); // Eager UI update
          if (positionTimer) { clearInterval(positionTimer); positionTimer = null; }
        } else {
          await TrackPlayer.play();
          set({ isPlaying: true }); // Eager UI update
          startTrackPlayerPositionTracking();
        }
      } catch (e) {
        console.error('[PlayerStore] togglePlayPause Error:', e);
      }
    } else if (expoPlayer) {
      if (expoPlayer.playing) {
        expoPlayer.pause();
        set({ isPlaying: false });
        updateWebPlaybackState(false);
      } else {
        expoPlayer.play();
        set({ isPlaying: true });
        updateWebPlaybackState(true);
      }
    }
  },

  skipNext: async () => {
    console.log('[PlayerStore] skipNext hit');
    if (isTransitioning) return;
    const { queue, currentTrack, repeatMode } = get();
    const idx = queue.findIndex(t => t.id === currentTrack?.id);
    
    if (isTrackPlayerAvailable) {
      try {
        await TrackPlayer.skipToNext();
      } catch (e) {
        console.error('[PlayerStore] skipNext Error:', e);
      }
    } else {
      let next: Track | null = null;
      if (idx >= 0 && idx < queue.length - 1) next = queue[idx + 1];
      else if (repeatMode === 'all' && queue.length > 0) next = queue[0];
      if (next) {
        set({ currentTrack: next });
        await loadAndPlayWithExpoAudio(next);
      } else {
        set({ isPlaying: false });
      }
    }
  },

  skipPrevious: async () => {
    console.log('[PlayerStore] skipPrevious hit');
    if (isTransitioning) return;
    const { queue, currentTrack, position } = get();
    const idx = queue.findIndex(t => t.id === currentTrack?.id);

    if (isTrackPlayerAvailable) {
      try {
        const pos = await TrackPlayer.getPosition();
        if (pos > 3) await TrackPlayer.seekTo(0);
        else await TrackPlayer.skipToPrevious();
      } catch (e) {
        console.error('[PlayerStore] skipPrevious Error:', e);
      }
    } else {
      if (position > 3 && expoPlayer) {
        try { await expoPlayer.seekTo(0); set({ position: 0 }); } catch {}
        return;
      }
      if (idx > 0) {
        const prev = queue[idx - 1];
        set({ currentTrack: prev });
        await loadAndPlayWithExpoAudio(prev);
      } else if (expoPlayer) {
        try { await expoPlayer.seekTo(0); set({ position: 0 }); } catch {}
      }
    }
  },

  seekTo: async (seconds) => {
    set({ position: seconds });
    if (isTrackPlayerAvailable) {
      await TrackPlayer.seekTo(seconds);
    } else if (expoPlayer) {
      try { await expoPlayer.seekTo(seconds); } catch {}
    }
  },

  addToQueue: async (track) => {
    const { isShuffled } = get();
    set(state => ({
      queue: [...state.queue, track],
      originalQueue: isShuffled ? state.originalQueue : [...state.originalQueue, track],
    }));
    if (isTrackPlayerAvailable) {
      await TrackPlayer.add([track]);
    }
  },

  applyEqPreset: (preset) => {
    if (!expoPlayer) return;
    const presets: Record<string, { rate: number; volume: number }> = {
      flat:   { rate: 1.0,  volume: 1.0 },
      bass:   { rate: 0.97, volume: 1.0 },
      treble: { rate: 1.03, volume: 0.95 },
      vocal:  { rate: 1.0,  volume: 0.9 },
    };
    const cfg = presets[preset] || presets.flat;
    try {
      expoPlayer.playbackRate = cfg.rate;
      expoPlayer.volume = cfg.volume;
    } catch {}
  },

  setSleepTimer: (minutes) => {
    if (sleepTimer) { clearInterval(sleepTimer); sleepTimer = null; }
    if (minutes === null) { set({ sleepTimerRemaining: null }); return; }

    let remaining = minutes * 60;
    set({ sleepTimerRemaining: remaining });

    sleepTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(sleepTimer!);
        sleepTimer = null;
        set({ sleepTimerRemaining: null });
        get().togglePlayPause().catch(() => {});
      } else {
        set({ sleepTimerRemaining: remaining });
      }
    }, 1000);
  },
}));
