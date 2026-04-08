import { create } from 'zustand';
import { Platform } from 'react-native';
import { Track } from '../types';
import { setupMediaControls, syncMediaPlaybackState, updateWebPositionState } from '../services/mediaControls';
import { createWebAudioPlayer, WebAudioPlayer } from '../utils/webAudio';

// Platform-conditional imports: expo-audio only on native
let createAudioPlayer: ((url: string) => any) | null = null;
let setAudioModeAsync: ((mode: any) => Promise<void>) | null = null;

if (Platform.OS !== 'web') {
  try {
    const expoAudio = require('expo-audio');
    createAudioPlayer = expoAudio.createAudioPlayer;
    setAudioModeAsync = expoAudio.setAudioModeAsync;
  } catch (e) {
    console.warn('expo-audio not available:', e);
  }
}

// Unified player factory
function createPlayer(url: string): any {
  if (Platform.OS === 'web') {
    return createWebAudioPlayer(url);
  }
  if (createAudioPlayer) {
    return createAudioPlayer(url);
  }
  throw new Error('No audio player available');
}

type AudioPlayer = any;

// Single shared AudioPlayer instance
let player: AudioPlayer | null = null;
let positionTimer: ReturnType<typeof setInterval> | null = null;
let sleepTimer: ReturnType<typeof setInterval> | null = null;
let isTransitioning = false;
let statusSubscription: { remove: () => void } | null = null;

// Next-track preloading
let preloadedPlayer: AudioPlayer | null = null;
let preloadedTrackId: string | null = null;

// Crossfade support
let crossfadeTimer: ReturnType<typeof setInterval> | null = null;
let outgoingPlayer: AudioPlayer | null = null;

async function configureAudio() {
  if (Platform.OS === 'web' || !setAudioModeAsync) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  } catch (e) {
    console.warn('Audio config error:', e);
  }
}

configureAudio();

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
  sleepTimerRemaining: number | null; // in seconds

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

function startPositionTracking() {
  stopPositionTracking();
  positionTimer = setInterval(() => {
    if (!player) return;
    try {
      const store = usePlayerStore.getState();
      const pos = player.currentTime ?? 0;
      const dur = player.duration ?? 0;
      if (Math.abs(pos - store.position) > 0.5) {
        usePlayerStore.setState({ position: pos });
        // Sync position to web media session progress bar
        updateWebPositionState(pos, dur);
      }
      if (dur > 0 && dur !== store.duration) {
        usePlayerStore.setState({ duration: dur });
      }
      // Crossfade trigger: start fading when near end of track
      if (dur > 0) {
        const { useSettingsStore } = require('./settingsStore');
        const settings = useSettingsStore.getState();
        if (settings.crossfadeEnabled && !isTransitioning) {
          const fadeTime = settings.crossfadeDuration || 5;
          const remaining = dur - pos;
          if (remaining <= fadeTime && remaining > 0.5) {
            startCrossfade(fadeTime);
          }
        }
      }
    } catch {}
  }, 500);
}

function stopPositionTracking() {
  if (positionTimer) {
    clearInterval(positionTimer);
    positionTimer = null;
  }
}

function cleanupPlayer() {
  if (crossfadeTimer) {
    clearInterval(crossfadeTimer);
    crossfadeTimer = null;
  }
  if (outgoingPlayer) {
    try { outgoingPlayer.pause(); } catch {}
    try { outgoingPlayer.remove(); } catch {}
    outgoingPlayer = null;
  }
  if (statusSubscription) {
    try { statusSubscription.remove(); } catch {}
    statusSubscription = null;
  }
  if (player) {
    try { player.pause(); } catch {}
    try { if (typeof player.clearLockScreenControls === 'function') player.clearLockScreenControls(); } catch {}
    try { player.remove(); } catch {}
    player = null;
  }
  stopPositionTracking();
}

function cleanupPreloadedPlayer() {
  if (preloadedPlayer) {
    try { preloadedPlayer.remove(); } catch {}
    preloadedPlayer = null;
    preloadedTrackId = null;
  }
}

// Crossfade: gradually fade out current, fade in next
let crossfadeStarted = false;
function startCrossfade(fadeTime: number) {
  if (crossfadeStarted || isTransitioning) return;
  crossfadeStarted = true;

  const { queue, currentTrack, repeatMode } = usePlayerStore.getState();
  const idx = queue.findIndex((t) => t.id === currentTrack?.id);
  let nextTrack: Track | null = null;
  if (idx >= 0 && idx < queue.length - 1) {
    nextTrack = queue[idx + 1];
  } else if (repeatMode === 'all' && queue.length > 0) {
    nextTrack = queue[0];
  }

  if (!nextTrack || !nextTrack.url) {
    crossfadeStarted = false;
    return;
  }

  isTransitioning = true;

  // Move current player to outgoing
  outgoingPlayer = player;
  player = null;

  // Create new player for next track
  try {
    let newPlayer: AudioPlayer;
    if (preloadedPlayer && preloadedTrackId === nextTrack.id) {
      newPlayer = preloadedPlayer;
      preloadedPlayer = null;
      preloadedTrackId = null;
    } else {
      cleanupPreloadedPlayer();
      const playUrl = (nextTrack as any).localPath || nextTrack.url;
      newPlayer = createPlayer(playUrl);
    }

    player = newPlayer;
    player.volume = 0; // start silent
    player.play();

    // Subscribe to new player
    if (statusSubscription) {
      try { statusSubscription.remove(); } catch {}
    }
    statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish && !isTransitioning) {
        handleTrackEnd();
      }
      const store = usePlayerStore.getState();
      if (status.playing !== undefined && status.playing !== store.isPlaying && !isTransitioning) {
        usePlayerStore.setState({ isPlaying: status.playing });
      }
      if (status.isBuffering !== undefined) {
        usePlayerStore.setState({ isBuffering: status.isBuffering });
      }
    });

    usePlayerStore.setState({ currentTrack: nextTrack, position: 0, duration: 0 });

    // Fade volumes over fadeTime
    const steps = fadeTime * 10; // 100ms steps
    let step = 0;
    crossfadeTimer = setInterval(() => {
      step++;
      const progress = step / steps;
      try {
        if (player) player.volume = Math.min(1, progress);
        if (outgoingPlayer) outgoingPlayer.volume = Math.max(0, 1 - progress);
      } catch {}

      if (step >= steps) {
        if (crossfadeTimer) clearInterval(crossfadeTimer);
        crossfadeTimer = null;
        // Cleanup outgoing
        if (outgoingPlayer) {
          try { outgoingPlayer.pause(); } catch {}
          try { outgoingPlayer.remove(); } catch {}
          outgoingPlayer = null;
        }
        isTransitioning = false;
        crossfadeStarted = false;
        startPositionTracking();
        setTimeout(preloadNextTrack, 2000);
        // Track recently played
        try {
          const { useLibraryStore } = require('./libraryStore');
          useLibraryStore.getState().addRecentlyPlayed(nextTrack!);
        } catch {}
      }
    }, 100);
  } catch (e) {
    console.error('Crossfade error:', e);
    isTransitioning = false;
    crossfadeStarted = false;
  }
}

// Preload the next track in the queue so transitions are instant
function preloadNextTrack() {
  const { queue, currentTrack } = usePlayerStore.getState();
  if (!currentTrack || queue.length < 2) return;
  const idx = queue.findIndex((t) => t.id === currentTrack.id);
  const nextTrack = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
  if (!nextTrack || !nextTrack.url || nextTrack.id === preloadedTrackId) return;
  cleanupPreloadedPlayer();
  try {
    const playUrl = (nextTrack as any).localPath || nextTrack.url;
    preloadedPlayer = createPlayer(playUrl);
    preloadedTrackId = nextTrack.id;
  } catch {}
}

async function loadAndPlay(track: Track) {
  // Prevent re-entry
  isTransitioning = true;

  if (!track.url) {
    console.warn('No URL for track:', track.title);
    usePlayerStore.setState({ isPlaying: false, isBuffering: false });
    isTransitioning = false;
    return;
  }

  usePlayerStore.setState({ isBuffering: true, position: 0, duration: 0 });

  try {
    // Check if this track was preloaded — use preloaded player for instant switch
    let newPlayer: AudioPlayer;
    if (preloadedPlayer && preloadedTrackId === track.id) {
      newPlayer = preloadedPlayer;
      preloadedPlayer = null;
      preloadedTrackId = null;
    } else {
      cleanupPreloadedPlayer();
      const playUrl = (track as any).localPath || track.url;
      newPlayer = createPlayer(playUrl);
    }

    // Cleanup old player AFTER creating new one (no gap)
    cleanupPlayer();
    player = newPlayer;

    // Listen for playback status updates (handles track end via didJustFinish)
    statusSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish && !isTransitioning) {
        handleTrackEnd();
      }
      // Handle media control actions from notification (next/previous track)
      if (status.mediaAction === 'nextTrack') {
        usePlayerStore.getState().skipNext();
        return;
      }
      if (status.mediaAction === 'previousTrack') {
        usePlayerStore.getState().skipPrevious();
        return;
      }
      // Sync playing state from native player (lock screen play/pause)
      const store = usePlayerStore.getState();
      if (status.playing !== undefined && status.playing !== store.isPlaying && !isTransitioning) {
        usePlayerStore.setState({ isPlaying: status.playing });
        syncMediaPlaybackState(status.playing);
      }
      if (status.isBuffering !== undefined) {
        usePlayerStore.setState({ isBuffering: status.isBuffering });
      }
    });

    // ── Media Controls: Lock Screen + Notification + Web Media Session ──
    setupMediaControls(player, track, {
      onPlay: () => usePlayerStore.getState().togglePlayPause(),
      onPause: () => usePlayerStore.getState().togglePlayPause(),
      onNextTrack: () => usePlayerStore.getState().skipNext(),
      onPreviousTrack: () => usePlayerStore.getState().skipPrevious(),
      onSeekForward: () => {
        const s = usePlayerStore.getState();
        s.seekTo(Math.min(s.position + 10, s.duration));
      },
      onSeekBackward: () => {
        const s = usePlayerStore.getState();
        s.seekTo(Math.max(s.position - 10, 0));
      },
    });

    // Handle repeat-one via player.loop
    const { repeatMode } = usePlayerStore.getState();
    player.loop = repeatMode === 'one';

    player.play();
    startPositionTracking();

    usePlayerStore.setState({ isPlaying: true, isBuffering: false });
    syncMediaPlaybackState(true);
    isTransitioning = false;

    // Start preloading the next track in background
    setTimeout(preloadNextTrack, 2000);
  } catch (e) {
    console.error('Playback error:', e);
    usePlayerStore.setState({ isPlaying: false, isBuffering: false });
    isTransitioning = false;
  }
}

async function handleTrackEnd() {
  if (isTransitioning) return;
  isTransitioning = true;

  const { repeatMode, queue, currentTrack } = usePlayerStore.getState();

  // repeat-one is handled by player.loop, but as fallback:
  if (repeatMode === 'one') {
    if (player) {
      try {
        await player.seekTo(0);
        player.play();
        usePlayerStore.setState({ position: 0, isPlaying: true });
      } catch {}
    }
    isTransitioning = false;
    return;
  }

  const idx = queue.findIndex((t) => t.id === currentTrack?.id);
  if (idx >= 0 && idx < queue.length - 1) {
    const next = queue[idx + 1];
    usePlayerStore.setState({ currentTrack: next });
    await loadAndPlay(next);
    // Track recently played
    try {
      const { useLibraryStore } = require('./libraryStore');
      useLibraryStore.getState().addRecentlyPlayed(next);
    } catch {}
  } else if (repeatMode === 'all' && queue.length > 0) {
    try {
      const first = queue[0];
      usePlayerStore.setState({ currentTrack: first });
      await loadAndPlay(first);
      try {
        const { useLibraryStore } = require('./libraryStore');
        useLibraryStore.getState().addRecentlyPlayed(first);
      } catch {}
    } catch (e) {
      console.error('Repeat all error:', e);
      isTransitioning = false;
    }
  } else {
    // Queue ended — try autoplay similar songs
    try {
      const { useSettingsStore } = require('./settingsStore');
      const settings = useSettingsStore.getState();
      if (settings.autoPlayEnabled && currentTrack) {
        isTransitioning = false;
        await autoPlaySimilar(currentTrack);
        return;
      }
    } catch {}
    usePlayerStore.setState({ isPlaying: false, position: 0 });
    stopPositionTracking();
    isTransitioning = false;
  }
}

// Autoplay: fetch similar songs and keep playing
async function autoPlaySimilar(track: Track) {
  try {
    const { getSimilarSongs, getCuratedSection } = require('../api/musicService');
    let similar: Track[] = [];
    // Try JioSaavn suggestions first
    if (track.source === 'jiosaavn') {
      similar = await getSimilarSongs(track.id, 15);
    }
    // Fallback: search by artist name
    if (similar.length === 0) {
      similar = await getCuratedSection(`${track.artist} similar songs`, 15);
    }
    if (similar.length > 0) {
      // Filter out tracks already in queue
      const { queue } = usePlayerStore.getState();
      const queueIds = new Set(queue.map((t: Track) => t.id));
      const newTracks = similar.filter((t: Track) => !queueIds.has(t.id));
      if (newTracks.length > 0) {
        // Add to queue and play first new track
        usePlayerStore.setState((state: any) => ({
          queue: [...state.queue, ...newTracks],
          originalQueue: [...state.originalQueue, ...newTracks],
        }));
        const next = newTracks[0];
        usePlayerStore.setState({ currentTrack: next });
        await loadAndPlay(next);
        try {
          const { useLibraryStore } = require('./libraryStore');
          useLibraryStore.getState().addRecentlyPlayed(next);
        } catch {}
        return;
      }
    }
  } catch (e) {
    console.error('Autoplay error:', e);
  }
  // Fallback: just stop
  usePlayerStore.setState({ isPlaying: false, position: 0 });
  stopPositionTracking();
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
  isPlayerReady: true,
  sleepTimerRemaining: null,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (tracks) => set({ queue: tracks }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setPosition: (pos) => set({ position: pos }),
  setDuration: (dur) => set({ duration: dur }),
  setPlayerReady: (ready) => set({ isPlayerReady: ready }),

  toggleRepeat: () => {
    const current = get().repeatMode;
    const next = current === 'off' ? 'all' : current === 'all' ? 'one' : 'off';
    set({ repeatMode: next });
    // Update player loop property
    if (player) {
      player.loop = next === 'one';
    }
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentTrack } = get();
    if (!isShuffled) {
      const currentId = currentTrack?.id;
      const otherTracks = queue.filter((t) => t.id !== currentId);

      // Smart Shuffle: weight songs by artist match with recently played
      let recentArtists: string[] = [];
      try {
        const { useLibraryStore } = require('./libraryStore');
        const recent = useLibraryStore.getState().recentlyPlayed || [];
        const liked = useLibraryStore.getState().likedSongs || [];
        const artistCounts = new Map<string, number>();
        [...recent, ...liked].forEach((t: Track) => {
          const a = t.artist?.split(',')[0]?.trim().toLowerCase();
          if (a) artistCounts.set(a, (artistCounts.get(a) || 0) + 1);
        });
        recentArtists = [...artistCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name]) => name);
      } catch {}

      // Score each track: higher score = more likely to be placed earlier
      const scored = otherTracks.map((t) => {
        let score = Math.random() * 0.4; // base randomness
        const artistLower = t.artist?.split(',')[0]?.trim().toLowerCase() || '';
        const matchIdx = recentArtists.indexOf(artistLower);
        if (matchIdx >= 0) {
          score += (10 - matchIdx) * 0.08; // boost familiar artists
        }
        return { track: t, score };
      });

      // Sort by score descending then add some shuffling to prevent strict ordering
      scored.sort((a, b) => b.score - a.score);
      // Apply light Fisher-Yates with limited swap distance for natural feel
      const shuffled = scored.map((s) => s.track);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const maxSwap = Math.min(i, Math.max(3, Math.floor(shuffled.length * 0.3)));
        const j = i - Math.floor(Math.random() * maxSwap);
        if (j >= 0) [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newQueue = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      set({ isShuffled: true, queue: newQueue, originalQueue: queue });
    } else {
      set({ isShuffled: false, queue: originalQueue.length > 0 ? originalQueue : queue });
    }
  },

  play: async (track, queue) => {
    if (isTransitioning) return;
    const tracksToQueue = queue ?? [track];
    set({ currentTrack: track, queue: tracksToQueue, originalQueue: tracksToQueue, isShuffled: false });
    await loadAndPlay(track);
    try {
      const { useLibraryStore } = require('./libraryStore');
      useLibraryStore.getState().addRecentlyPlayed(track);
    } catch {}
  },

  togglePlayPause: async () => {
    if (!player) {
      const track = get().currentTrack;
      if (track) await loadAndPlay(track);
      return;
    }
    try {
      if (player.playing) {
        player.pause();
        set({ isPlaying: false });
        syncMediaPlaybackState(false);
      } else {
        player.play();
        set({ isPlaying: true });
        syncMediaPlaybackState(true);
      }
    } catch (e) {
      console.error('Toggle error:', e);
    }
  },

  skipNext: async () => {
    if (isTransitioning) return;
    const { queue, currentTrack, repeatMode } = get();
    const idx = queue.findIndex((t) => t.id === currentTrack?.id);
    let next: Track | null = null;
    if (idx >= 0 && idx < queue.length - 1) {
      next = queue[idx + 1];
    } else if (repeatMode === 'all' && queue.length > 0) {
      next = queue[0];
    }
    if (next) {
      set({ currentTrack: next });
      await loadAndPlay(next);
      try {
        const { useLibraryStore } = require('./libraryStore');
        useLibraryStore.getState().addRecentlyPlayed(next);
      } catch {}
    }
  },

  skipPrevious: async () => {
    if (isTransitioning) return;
    const { queue, currentTrack, position } = get();
    if (position > 3 && player) {
      try {
        await player.seekTo(0);
        set({ position: 0 });
      } catch {}
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack?.id);
    if (idx > 0) {
      const prev = queue[idx - 1];
      set({ currentTrack: prev });
      await loadAndPlay(prev);
      try {
        const { useLibraryStore } = require('./libraryStore');
        useLibraryStore.getState().addRecentlyPlayed(prev);
      } catch {}
    } else if (player) {
      try {
        await player.seekTo(0);
        set({ position: 0 });
      } catch {}
    }
  },

  seekTo: async (seconds) => {
    set({ position: seconds, isBuffering: true });
    if (!player) return;
    try {
      await player.seekTo(seconds);
      set({ isBuffering: false });
    } catch {
      set({ isBuffering: false });
    }
  },

  addToQueue: async (track) => {
    const { isShuffled } = get();
    set((state) => ({
      queue: [...state.queue, track],
      originalQueue: isShuffled ? state.originalQueue : [...state.originalQueue, track],
    }));
  },

  applyEqPreset: (preset) => {
    if (!player) return;
    // Map EQ presets to playback rate + volume adjustments.
    const presets: Record<string, { rate: number; volume: number }> = {
      flat:   { rate: 1.0,  volume: 1.0 },
      bass:   { rate: 0.97, volume: 1.0 },
      treble: { rate: 1.03, volume: 0.95 },
      vocal:  { rate: 1.0,  volume: 0.9 },
    };
    const cfg = presets[preset] || presets.flat;
    try {
      player.playbackRate = cfg.rate;
      player.volume = cfg.volume;
    } catch (e) {
      console.warn('EQ preset error:', e);
    }
  },

  setSleepTimer: (minutes) => {
    if (sleepTimer) {
      clearInterval(sleepTimer);
      sleepTimer = null;
    }

    if (minutes === null) {
      set({ sleepTimerRemaining: null });
      return;
    }

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
