/**
 * Web Audio Player — wraps HTMLAudioElement to match expo-audio AudioPlayer API.
 * Used on web platform where expo-audio's createAudioPlayer is unavailable.
 */

type StatusCallback = (status: {
  playing?: boolean;
  didJustFinish?: boolean;
  isBuffering?: boolean;
  duration?: number;
  currentTime?: number;
}) => void;

export class WebAudioPlayer {
  private audio: HTMLAudioElement;
  private listeners: Map<string, Set<StatusCallback>> = new Map();
  private _removed = false;

  constructor(url?: string) {
    this.audio = new Audio(url);
    this.audio.preload = 'auto';

    this.audio.addEventListener('playing', () => {
      this.emit({ playing: true, isBuffering: false });
    });
    this.audio.addEventListener('pause', () => {
      this.emit({ playing: false });
    });
    this.audio.addEventListener('ended', () => {
      this.emit({ didJustFinish: true, playing: false });
    });
    this.audio.addEventListener('waiting', () => {
      this.emit({ isBuffering: true });
    });
    this.audio.addEventListener('canplay', () => {
      this.emit({ isBuffering: false });
    });
    this.audio.addEventListener('timeupdate', () => {
      this.emit({
        currentTime: this.audio.currentTime,
        duration: this.audio.duration || 0,
      });
    });
    this.audio.addEventListener('loadedmetadata', () => {
      this.emit({ duration: this.audio.duration || 0, isBuffering: false });
    });
  }

  private emit(status: Parameters<StatusCallback>[0]) {
    const set = this.listeners.get('playbackStatusUpdate');
    if (set) set.forEach((cb) => { try { cb(status); } catch {} });
  }

  get playing(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return this.audio.duration || 0;
  }

  get volume(): number {
    return this.audio.volume;
  }
  set volume(v: number) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  get playbackRate(): number {
    return this.audio.playbackRate;
  }
  set playbackRate(r: number) {
    this.audio.playbackRate = r;
  }

  get loop(): boolean {
    return this.audio.loop;
  }
  set loop(v: boolean) {
    this.audio.loop = v;
  }

  get muted(): boolean {
    return this.audio.muted;
  }
  set muted(v: boolean) {
    this.audio.muted = v;
  }

  play() {
    this.audio.play().catch(() => {});
  }

  pause() {
    this.audio.pause();
  }

  async seekTo(seconds: number) {
    this.audio.currentTime = seconds;
  }

  replace(url: string) {
    this.audio.src = url;
    this.audio.load();
  }

  remove() {
    if (this._removed) return;
    this._removed = true;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load(); // release resources
    this.listeners.clear();
  }

  addListener(event: string, callback: StatusCallback): { remove: () => void } {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return {
      remove: () => { this.listeners.get(event)?.delete(callback); },
    };
  }

  // Stubs for native-only methods — no-ops on web
  setActiveForLockScreen() {}
  updateLockScreenMetadata() {}
  clearLockScreenControls() {}
}

/**
 * Factory matching createAudioPlayer(url) signature.
 */
export function createWebAudioPlayer(url?: string): WebAudioPlayer {
  return new WebAudioPlayer(url);
}
