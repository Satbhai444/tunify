import { Platform } from 'react-native';
import { Track, Album, Artist, Playlist, SearchResults, LyricLine } from '../types';

const BASE_URL = 'https://jiosavan-api2.vercel.app/api';
const PROXY_URL = 'https://corsproxy.io/?';

// Fetch with timeout to prevent hanging on slow networks
async function fetchJson<T>(endpoint: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = Platform.OS === 'web'
      ? `${PROXY_URL}${encodeURIComponent(`${BASE_URL}${endpoint}`)}`
      : `${BASE_URL}${endpoint}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`JioSaavn API error: ${res.status}`);
    const data = await res.json();
    return data.data ?? data;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// Dynamic quality selection based on settings
let preferredQuality = '160kbps';
export function setPreferredQuality(q: string) { preferredQuality = q; }

function normalizeTrack(raw: any): Track {
  // Pick quality based on user setting; fallback chain ensures we always get a URL
  const downloadUrl = raw.downloadUrl?.find((u: any) => u.quality === preferredQuality)
    ?? raw.downloadUrl?.find((u: any) => u.quality === '160kbps')
    ?? raw.downloadUrl?.find((u: any) => u.quality === '96kbps')
    ?? raw.downloadUrl?.find((u: any) => u.quality === '320kbps')
    ?? raw.downloadUrl?.[0];

  // Map all artists (primary and secondary)
  const allArtists = [
    ...(raw.artists?.primary ?? []),
    ...(raw.artists?.featured ?? []),
    ...(raw.artists?.all ?? []),
  ];
  
  // Deduplicate by ID or name
  const seen = new Set();
  const artists = allArtists
    .map((a: any) => ({ name: a.name, id: a.id }))
    .filter((a: any) => {
      const key = a.id || a.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return {
    id: `js_${raw.id}`,
    title: raw.name ?? raw.title ?? 'Unknown',
    artist: artists.map(a => a.name).join(', ') || 'Unknown Artist',
    artistId: artists[0]?.id,
    artists: artists.length > 0 ? artists : undefined,
    album: raw.album?.name ?? '',
    albumId: raw.album?.id,
    duration: Number(raw.duration) || 0,
    artwork: raw.image?.find((i: any) => i.quality === '500x500')?.url
      ?? raw.image?.[raw.image.length - 1]?.url ?? '',
    url: downloadUrl?.url ?? '',
    source: 'jiosaavn',
    hasLyrics: raw.hasLyrics === 'true' || raw.hasLyrics === true,
  };
}

function normalizeAlbum(raw: any): Album {
  const allArtists = raw.artists?.primary ?? 
                     (raw.primaryArtists ? [{ name: raw.primaryArtists, id: '' }] : []);
  const artists = allArtists.map((a: any) => ({ name: a.name, id: a.id }));

  return {
    id: `js_${raw.id}`,
    title: raw.name ?? raw.title ?? 'Unknown',
    artist: artists.map((a: any) => a.name).join(', ') || 'Unknown',
    artistId: artists[0]?.id,
    artists: artists.length > 0 ? artists : undefined,
    artwork: raw.image?.find((i: any) => i.quality === '500x500')?.url
      ?? raw.image?.[raw.image.length - 1]?.url ?? '',
    year: raw.year,
    trackCount: raw.songCount,
    source: 'jiosaavn',
  };
}

function normalizeArtist(raw: any): Artist {
  return {
    id: `js_${raw.id}`,
    name: raw.name ?? 'Unknown',
    image: raw.image?.find((i: any) => i.quality === '500x500')?.url
      ?? raw.image?.[raw.image.length - 1]?.url ?? '',
    followerCount: raw.followerCount,
    source: 'jiosaavn',
  };
}

function normalizePlaylist(raw: any): Playlist {
  return {
    id: `js_${raw.id}`,
    title: raw.name ?? raw.title ?? 'Unknown',
    description: raw.description,
    artwork: raw.image?.find((i: any) => i.quality === '500x500')?.url
      ?? raw.image?.[raw.image.length - 1]?.url ?? '',
    trackCount: raw.songCount ?? 0,
    source: 'jiosaavn',
  };
}

export async function searchJioSaavn(query: string): Promise<SearchResults> {
  // Fetch songs and metadata independently — one failing shouldn't break the other
  let tracks: Track[] = [];
  let albums: Album[] = [];
  let artists: Artist[] = [];
  let playlists: Playlist[] = [];

  const [songsResult, metaResult] = await Promise.allSettled([
    fetchJson<any>(`/search/songs?query=${encodeURIComponent(query)}&limit=50`),
    fetchJson<any>(`/search?query=${encodeURIComponent(query)}&limit=20`),
  ]);

  if (songsResult.status === 'fulfilled') {
    tracks = (songsResult.value.results ?? []).map(normalizeTrack);
  }
  if (metaResult.status === 'fulfilled') {
    const meta = metaResult.value;
    albums = (meta.albums?.results ?? []).map(normalizeAlbum);
    artists = (meta.artists?.results ?? []).map(normalizeArtist);
    playlists = (meta.playlists?.results ?? []).map(normalizePlaylist);
  }

  return { tracks, albums, artists, playlists };
}

export async function searchJioSaavnSongs(query: string, limit = 20): Promise<Track[]> {
  try {
    const data = await fetchJson<any>(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.results ?? []).map(normalizeTrack);
  } catch {
    return [];
  }
}

export async function getTrending(): Promise<Track[]> {
  try {
    const data = await fetchJson<any>('/playlists?id=110858205&limit=50');
    return (data.songs ?? []).map(normalizeTrack);
  } catch {
    return [];
  }
}

export async function getPlaylistTracks(playlistId: string, limit = 30): Promise<Track[]> {
  try {
    const data = await fetchJson<any>(`/playlists?id=${playlistId}&limit=${limit}`);
    return (data.songs ?? []).map(normalizeTrack);
  } catch {
    return [];
  }
}

export async function getCuratedSection(query: string, limit = 20): Promise<Track[]> {
  try {
    const data = await fetchJson<any>(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.results ?? []).map(normalizeTrack);
  } catch {
    return [];
  }
}

export async function getNewReleases(): Promise<Album[]> {
  try {
    const data = await fetchJson<any>('/modules?language=hindi');
    const albums = data.newAlbums ?? data.albums ?? [];
    return Array.isArray(albums) ? albums.map(normalizeAlbum) : [];
  } catch {
    return [];
  }
}

export async function getSongDetails(id: string): Promise<Track | null> {
  try {
    const realId = id.replace('js_', '');
    const data = await fetchJson<any>(`/songs/${realId}`);
    const songs = Array.isArray(data) ? data : [data];
    return songs.length > 0 ? normalizeTrack(songs[0]) : null;
  } catch {
    return null;
  }
}

export async function getAlbumDetails(id: string): Promise<{ album: Album; tracks: Track[] } | null> {
  try {
    const realId = id.replace('js_', '');
    const data = await fetchJson<any>(`/albums?id=${realId}`);
    return {
      album: normalizeAlbum(data),
      tracks: (data.songs ?? []).map(normalizeTrack),
    };
  } catch {
    return null;
  }
}

export async function getArtistDetails(id: string): Promise<{ artist: Artist; topSongs: Track[] } | null> {
  try {
    const realId = id.replace('js_', '');
    const data = await fetchJson<any>(`/artists/${realId}`);
    return {
      artist: normalizeArtist(data),
      topSongs: (data.topSongs ?? []).map(normalizeTrack),
      // If the API supports more songs, we can fetch artist/songs later
    };
  } catch {
    return null;
  }
}

export async function getSimilarSongs(songId: string, limit = 20): Promise<Track[]> {
  try {
    const realId = songId.replace('js_', '');
    const data = await fetchJson<any>(`/songs/${realId}/suggestions?limit=${limit}`);
    const songs = Array.isArray(data) ? data : (data.results ?? data.songs ?? []);
    return songs.map(normalizeTrack).filter((t: Track) => t.url);
  } catch {
    // Fallback: search by artist name
    return [];
  }
}

export async function getLyrics(songId: string): Promise<LyricLine[]> {
  try {
    const realId = songId.replace('js_', '');
    const data = await fetchJson<any>(`/songs/${realId}/lyrics`);
    const lyricsText: string = data.lyrics ?? '';
    return lyricsText.split('\n').map((line, i) => ({
      time: i * 5, // approximate timing
      text: line.trim(),
    })).filter(l => l.text.length > 0);
  } catch {
    return [];
  }
}

export async function getPlaylistDetails(id: string): Promise<Playlist | null> {
  try {
    const realId = id.replace('js_', '');
    const data = await fetchJson<any>(`/playlists?id=${realId}`);
    const playlist = normalizePlaylist(data);
    playlist.tracks = (data.songs ?? []).map(normalizeTrack);
    return playlist;
  } catch {
    return null;
  }
}

// Get curated playlists for browsing (returns playlist metadata, not tracks)
export async function getTopPlaylists(query: string, limit = 10): Promise<Playlist[]> {
  try {
    const data = await fetchJson<any>(`/search?query=${encodeURIComponent(query)}`);
    return (data.playlists?.results ?? []).slice(0, limit).map(normalizePlaylist);
  } catch {
    return [];
  }
}

// Get top artists from search
export async function getTopArtists(query: string, limit = 10): Promise<Artist[]> {
  try {
    const data = await fetchJson<any>(`/search?query=${encodeURIComponent(query)}`);
    return (data.artists?.results ?? []).slice(0, limit).map(normalizeArtist);
  } catch {
    return [];
  }
}

// Get albums from search
export async function getTopAlbums(query: string, limit = 10): Promise<Album[]> {
  try {
    const data = await fetchJson<any>(`/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.results ?? []).map(normalizeAlbum);
  } catch {
    return [];
  }
}
