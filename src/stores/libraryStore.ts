import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, UserPlaylist, DownloadedTrack } from '../types';

const LIKED_KEY = 'tunify_liked_songs';
const PLAYLISTS_KEY = 'tunify_playlists';
const PLAYLIST_TRACKS_KEY = 'tunify_playlist_tracks';
const DOWNLOADS_KEY = 'tunify_downloads';
const RECENT_KEY = 'tunify_recent_searches';
const RECENT_PLAYED_KEY = 'tunify_recently_played';

export interface LibraryState {
  likedSongs: Track[];
  playlists: UserPlaylist[];
  playlistTracks: Record<string, Track>;
  downloads: DownloadedTrack[];
  recentSearches: string[];
  recentlyPlayed: Track[];

  // Init
  loadLibrary: () => Promise<void>;

  // Liked Songs
  toggleLike: (track: Track) => Promise<void>;
  isLiked: (trackId: string) => boolean;

  // Playlists
  createPlaylist: (title: string, description?: string) => Promise<UserPlaylist>;
  renamePlaylist: (id: string, newTitle: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylistTracks: (playlistId: string) => Track[];

  // Downloads
  addDownload: (track: DownloadedTrack) => Promise<void>;
  removeDownload: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;

  // Recently Played
  addRecentlyPlayed: (track: Track) => Promise<void>;
  clearRecentlyPlayed: () => Promise<void>;

  // Recent Searches
  addRecentSearch: (query: string) => Promise<void>;
  removeRecentSearch: (query: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  likedSongs: [],
  playlists: [],
  playlistTracks: {},
  downloads: [],
  recentSearches: [],
  recentlyPlayed: [],

  loadLibrary: async () => {
    try {
      const [liked, playlists, ptracks, downloads, recent, recentPlayed] = await Promise.all([
        AsyncStorage.getItem(LIKED_KEY),
        AsyncStorage.getItem(PLAYLISTS_KEY),
        AsyncStorage.getItem(PLAYLIST_TRACKS_KEY),
        AsyncStorage.getItem(DOWNLOADS_KEY),
        AsyncStorage.getItem(RECENT_KEY),
        AsyncStorage.getItem(RECENT_PLAYED_KEY),
      ]);
      set({
        likedSongs: liked ? JSON.parse(liked) : [],
        playlists: playlists ? JSON.parse(playlists) : [],
        playlistTracks: ptracks ? JSON.parse(ptracks) : {},
        downloads: downloads ? JSON.parse(downloads) : [],
        recentSearches: recent ? JSON.parse(recent) : [],
        recentlyPlayed: recentPlayed ? JSON.parse(recentPlayed) : [],
      });
    } catch {
      // Storage read failure is non-critical
    }
  },

  toggleLike: async (track) => {
    const { likedSongs } = get();
    const idx = likedSongs.findIndex((t) => t.id === track.id);
    const updated = idx >= 0
      ? likedSongs.filter((t) => t.id !== track.id)
      : [track, ...likedSongs];
    set({ likedSongs: updated });
    await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(updated));
  },

  isLiked: (trackId) => {
    return get().likedSongs.some((t) => t.id === trackId);
  },

  createPlaylist: async (title, description) => {
    const playlist: UserPlaylist = {
      id: `pl_${Date.now()}`,
      title,
      description,
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [playlist, ...get().playlists];
    set({ playlists: updated });
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
    return playlist;
  },

  renamePlaylist: async (id, newTitle) => {
    const updated = get().playlists.map((p) =>
      p.id === id ? { ...p, title: newTitle, updatedAt: Date.now() } : p
    );
    set({ playlists: updated });
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
  },

  deletePlaylist: async (id) => {
    const updated = get().playlists.filter((p) => p.id !== id);
    set({ playlists: updated });
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
  },

  addToPlaylist: async (playlistId, track) => {
    const playlists = get().playlists.map((p) => {
      if (p.id === playlistId && !p.trackIds.includes(track.id)) {
        return { ...p, trackIds: [...p.trackIds, track.id], updatedAt: Date.now() };
      }
      return p;
    });
    const playlistTracks = { ...get().playlistTracks, [track.id]: track };
    set({ playlists, playlistTracks });
    await Promise.all([
      AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists)),
      AsyncStorage.setItem(PLAYLIST_TRACKS_KEY, JSON.stringify(playlistTracks)),
    ]);
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    const playlists = get().playlists.map((p) => {
      if (p.id === playlistId) {
        return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() };
      }
      return p;
    });
    set({ playlists });
    await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  },

  addDownload: async (track) => {
    const updated = [track, ...get().downloads.filter((d) => d.id !== track.id)];
    set({ downloads: updated });
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
  },

  removeDownload: async (trackId) => {
    const updated = get().downloads.filter((d) => d.id !== trackId);
    set({ downloads: updated });
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
  },

  isDownloaded: (trackId) => {
    return get().downloads.some((d) => d.id === trackId);
  },

  getPlaylistTracks: (playlistId) => {
    const { playlists, playlistTracks } = get();
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return [];
    return pl.trackIds.map((id) => playlistTracks[id]).filter(Boolean) as Track[];
  },

  addRecentlyPlayed: async (track) => {
    const updated = [track, ...get().recentlyPlayed.filter((t) => t.id !== track.id)].slice(0, 30);
    set({ recentlyPlayed: updated });
    await AsyncStorage.setItem(RECENT_PLAYED_KEY, JSON.stringify(updated));
  },

  clearRecentlyPlayed: async () => {
    set({ recentlyPlayed: [] });
    await AsyncStorage.removeItem(RECENT_PLAYED_KEY);
  },

  addRecentSearch: async (query) => {
    const recent = [query, ...get().recentSearches.filter((q) => q !== query)].slice(0, 10);
    set({ recentSearches: recent });
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  },

  removeRecentSearch: async (query) => {
    const recent = get().recentSearches.filter((q) => q !== query);
    set({ recentSearches: recent });
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  },

  clearRecentSearches: async () => {
    set({ recentSearches: [] });
    await AsyncStorage.removeItem(RECENT_KEY);
  },
}));
