/**
 * Media Controls Service — Lock Screen, Notification Bar & Control Center
 *
 * Native (Android/iOS):
 *   Uses expo-audio's setActiveForLockScreen() to show metadata
 *   (title, artist, album art) and handle play/pause natively.
 *   Seek forward/backward buttons available for 10s jumps.
 *
 * Web (Expo Web):
 *   Uses the Web Media Session API (navigator.mediaSession) for full
 *   control: play, pause, next, previous, seek forward/backward.
 *
 * NOTE: Album art URL must be HTTPS for lock screen display.
 * NOTE: Media Session activates only after the user initiates playback
 *       from within the app (browser security policy).
 */

import type { AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import type { Track } from '../types/music';

/* ─────────────── NATIVE (expo-audio) ─────────────── */

/**
 * Register the player for lock screen / notification controls.
 * Displays song title, artist, album art.
 * Play/pause is handled natively by the AudioPlayer.
 */
export function setupNativeLockScreen(player: AudioPlayer, track: Track) {
  try {
    if (typeof player.setActiveForLockScreen !== 'function') {
      if (__DEV__) console.log('[MediaControls] ⚠️ setActiveForLockScreen not available (Expo Go mode)');
      return;
    }

    player.setActiveForLockScreen(
      true,
      {
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        albumTitle: track.album || 'tunify',
        artworkUrl: track.artwork || '', // Must be HTTPS
      },
      {
        showSeekForward: true,
        showSeekBackward: true,
      },
    );
  } catch (e) {
    console.warn('[MediaControls] Native lock screen setup failed:', e);
  }
}

/**
 * Update metadata on an already-active lock screen session.
 * Use when track info changes without creating a new player.
 */
export function updateNativeMetadata(player: AudioPlayer, track: Track) {
  try {
    if (typeof player.updateLockScreenMetadata !== 'function') return;

    player.updateLockScreenMetadata({
      title: track.title || 'Unknown Title',
      artist: track.artist || 'Unknown Artist',
      albumTitle: track.album || 'tunify',
      artworkUrl: track.artwork || '',
    });
  } catch (e) {
    console.warn('[MediaControls] Native metadata update failed:', e);
  }
}

/**
 * Remove control from the lock screen / notification.
 */
export function clearNativeLockScreen(player: AudioPlayer) {
  try {
    if (typeof player.clearLockScreenControls !== 'function') return;
    player.clearLockScreenControls();
  } catch (e) {
    console.warn('[MediaControls] Native clear failed:', e);
  }
}

/* ─────────────── WEB (Media Session API) ─────────────── */

interface MediaHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
}

/**
 * Set up the Web Media Session API.
 * Shows metadata in the browser's media controls / OS control center.
 * Registers handlers for play, pause, next, previous, seek.
 */
export function setupWebMediaSession(track: Track, handlers: MediaHandlers) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  const ms = navigator.mediaSession;

  // --- Metadata: title, artist, album, artwork ---
  ms.metadata = new MediaMetadata({
    title: track.title || 'Unknown Title',
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'tunify',
    artwork: track.artwork
      ? [
          { src: track.artwork, sizes: '96x96', type: 'image/jpeg' },
          { src: track.artwork, sizes: '256x256', type: 'image/jpeg' },
          { src: track.artwork, sizes: '512x512', type: 'image/jpeg' },
        ]
      : [],
  });

  // --- Action handlers ---
  try { ms.setActionHandler('play', handlers.onPlay); } catch {}
  try { ms.setActionHandler('pause', handlers.onPause); } catch {}
  try { ms.setActionHandler('nexttrack', handlers.onNextTrack); } catch {}
  try { ms.setActionHandler('previoustrack', handlers.onPreviousTrack); } catch {}
  try {
    ms.setActionHandler('seekforward', (details) => {
      handlers.onSeekForward();
    });
  } catch {}
  try {
    ms.setActionHandler('seekbackward', (details) => {
      handlers.onSeekBackward();
    });
  } catch {}
}

/**
 * Sync the play/pause state in the browser's media control center.
 */
export function updateWebPlaybackState(isPlaying: boolean) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

/**
 * Update position info so the browser shows a progress bar
 * in the OS media controls (Chrome on Android, etc.).
 */
export function updateWebPositionState(position: number, duration: number, playbackRate: number = 1) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate,
      position: Math.max(0, Math.min(position, duration)),
    });
  } catch {}
}

/* ─────────────── UNIFIED SETUP ─────────────── */

/**
 * One-call setup: registers both native lock screen AND web media session.
 * Call this every time a new track starts playing.
 */
export function setupMediaControls(
  player: AudioPlayer | null,
  track: Track,
  handlers: MediaHandlers,
) {
  if (__DEV__) {
    console.log(`[MediaControls] ✅ Setting up for: "${track.title}" by ${track.artist}`);
    console.log(`[MediaControls] Artwork: ${track.artwork?.substring(0, 60)}...`);
  }

  // Native lock screen (Android / iOS)
  if (player && Platform.OS !== 'web') {
    if (__DEV__) console.log('[MediaControls] Platform: Native → using expo-audio lock screen');
    setupNativeLockScreen(player, track);
  }

  // Web Media Session API (browser / Expo Web)
  if (Platform.OS === 'web') {
    if (__DEV__) console.log('[MediaControls] Platform: Web → using Media Session API');
  }
  setupWebMediaSession(track, handlers);
}

/**
 * Sync the playback state across all surfaces.
 */
export function syncMediaPlaybackState(isPlaying: boolean) {
  updateWebPlaybackState(isPlaying);
}
