import { Track, SearchResults } from '../types';
import { searchJioSaavn, searchJioSaavnSongs, getTrending, getNewReleases, getPlaylistTracks, getCuratedSection, getSongDetails, getAlbumDetails, getArtistDetails, getLyrics, getPlaylistDetails, getSimilarSongs, setPreferredQuality, getTopPlaylists, getTopArtists, getTopAlbums } from './jiosaavn';
import { searchDeezer, getDeezerChart } from './deezer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'tunify_cache_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Cache write failure is non-critical
  }
}

function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Map<string, Track>();
  for (const track of tracks) {
    const key = `${track.title.toLowerCase()}_${track.artist.toLowerCase()}`;
    const existing = seen.get(key);
    // Prefer JioSaavn (full songs) over Deezer (30s previews)
    if (!existing || (track.source === 'jiosaavn' && existing.source === 'deezer')) {
      seen.set(key, track);
    }
  }
  return Array.from(seen.values());
}

export async function search(query: string): Promise<SearchResults> {
  const cacheKey = `search_${query}`;
  const cached = await getCached<SearchResults>(cacheKey);
  if (cached && cached.tracks && cached.tracks.length > 0) return cached;

  // JioSaavn is primary source — get results even if Deezer hangs/fails
  let jsResults: SearchResults = { tracks: [], albums: [], artists: [], playlists: [] };
  let dzResults: SearchResults = { tracks: [], albums: [], artists: [], playlists: [] };
  
  try {
    // Start both but don't let Deezer slow us down
    const jsPromise = searchJioSaavn(query);
    const dzPromise = Promise.race([
      searchDeezer(query),
      new Promise<SearchResults>((resolve) => setTimeout(() => resolve({ tracks: [], albums: [], artists: [], playlists: [] }), 4000)),
    ]);

    const [js, dz] = await Promise.allSettled([jsPromise, dzPromise]);
    if (js.status === 'fulfilled') jsResults = js.value;
    if (dz.status === 'fulfilled') dzResults = dz.value;
  } catch (e) {
    console.error('Search error:', e);
  }

  const merged: SearchResults = {
    tracks: deduplicateTracks([...jsResults.tracks, ...dzResults.tracks]),
    albums: [...jsResults.albums, ...dzResults.albums],
    artists: [...jsResults.artists, ...dzResults.artists],
    playlists: jsResults.playlists,
  };

  if (merged.tracks.length > 0) {
    await setCache(cacheKey, merged);
  }
  return merged;
}

export async function searchSongs(query: string): Promise<Track[]> {
  return searchJioSaavnSongs(query);
}

export { getTrending, getNewReleases, getPlaylistTracks, getCuratedSection, getSongDetails, getAlbumDetails, getArtistDetails, getLyrics, getPlaylistDetails, getDeezerChart, getSimilarSongs, setPreferredQuality, getTopPlaylists, getTopArtists, getTopAlbums };
