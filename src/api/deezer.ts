import { Track, Album, Artist, SearchResults } from '../types';

const BASE_URL = 'https://api.deezer.com';

// Short timeout — Deezer is often blocked/slow in India
async function fetchJson<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);
    return res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function normalizeTrack(raw: any): Track {
  return {
    id: `dz_${raw.id}`,
    title: raw.title ?? raw.title_short ?? 'Unknown',
    artist: raw.artist?.name ?? 'Unknown Artist',
    artistId: raw.artist?.id ? `dz_${raw.artist.id}` : undefined,
    album: raw.album?.title ?? '',
    albumId: raw.album?.id ? `dz_${raw.album.id}` : undefined,
    duration: raw.duration ?? 0,
    artwork: raw.album?.cover_xl ?? raw.album?.cover_big ?? raw.album?.cover_medium ?? '',
    url: raw.preview ?? '', // 30s preview only
    source: 'deezer',
  };
}

function normalizeAlbum(raw: any): Album {
  return {
    id: `dz_${raw.id}`,
    title: raw.title ?? 'Unknown',
    artist: raw.artist?.name ?? 'Unknown',
    artistId: raw.artist?.id ? `dz_${raw.artist.id}` : undefined,
    artwork: raw.cover_xl ?? raw.cover_big ?? raw.cover_medium ?? '',
    trackCount: raw.nb_tracks,
    source: 'deezer',
  };
}

function normalizeArtist(raw: any): Artist {
  return {
    id: `dz_${raw.id}`,
    name: raw.name ?? 'Unknown',
    image: raw.picture_xl ?? raw.picture_big ?? raw.picture_medium ?? '',
    followerCount: raw.nb_fan,
    source: 'deezer',
  };
}

export async function searchDeezer(query: string): Promise<SearchResults> {
  try {
    const [tracksData, albumsData, artistsData] = await Promise.all([
      fetchJson<any>(`/search?q=${encodeURIComponent(query)}&limit=10`),
      fetchJson<any>(`/search/album?q=${encodeURIComponent(query)}&limit=5`),
      fetchJson<any>(`/search/artist?q=${encodeURIComponent(query)}&limit=5`),
    ]);

    return {
      tracks: (tracksData.data ?? []).map(normalizeTrack),
      albums: (albumsData.data ?? []).map(normalizeAlbum),
      artists: (artistsData.data ?? []).map(normalizeArtist),
      playlists: [],
    };
  } catch {
    return { tracks: [], albums: [], artists: [], playlists: [] };
  }
}

export async function getDeezerChart(): Promise<Track[]> {
  try {
    const data = await fetchJson<any>('/chart/0/tracks?limit=20');
    return (data.data ?? []).map(normalizeTrack);
  } catch {
    return [];
  }
}

export async function getDeezerArtistTopTracks(id: string): Promise<Track[]> {
  try {
    const realId = id.replace('dz_', '');
    const data = await fetchJson<any>(`/artist/${realId}/top?limit=20`);
    return (data.data ?? []).map(normalizeTrack);
  } catch {
    return [];
  }
}
