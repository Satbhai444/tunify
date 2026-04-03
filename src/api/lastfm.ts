import { Track } from '../types';

const API_KEY = '308da0a30996922e1ed8b7c90975b625';
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

async function fetchLastFm(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, api_key: API_KEY, format: 'json' }).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE_URL}?${qs}`, { signal: controller.signal });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface LastFmArtistInfo {
  name: string;
  image: string;
  bio: string;
  listeners: string;
  playcount: string;
  tags: string[];
  similar: { name: string; image: string }[];
}

export interface LastFmTopTrack {
  name: string;
  playcount: string;
  listeners: string;
  artist: string;
  image: string;
}

export async function getArtistInfo(artistName: string): Promise<LastFmArtistInfo | null> {
  const data = await fetchLastFm({ method: 'artist.getinfo', artist: artistName });
  if (!data?.artist) return null;
  const a = data.artist;
  const image = a.image?.find((i: any) => i.size === 'extralarge')?.['#text']
    ?? a.image?.find((i: any) => i.size === 'large')?.['#text']
    ?? a.image?.[a.image.length - 1]?.['#text'] ?? '';
  return {
    name: a.name ?? artistName,
    image,
    bio: a.bio?.summary?.replace(/<[^>]*>/g, '').trim() ?? '',
    listeners: a.stats?.listeners ?? '0',
    playcount: a.stats?.playcount ?? '0',
    tags: (a.tags?.tag ?? []).slice(0, 5).map((t: any) => t.name),
    similar: (a.similar?.artist ?? []).slice(0, 5).map((s: any) => ({
      name: s.name,
      image: s.image?.find((i: any) => i.size === 'medium')?.['#text'] ?? '',
    })),
  };
}

export async function getArtistTopTracks(artistName: string, limit = 5): Promise<LastFmTopTrack[]> {
  const data = await fetchLastFm({ method: 'artist.gettoptracks', artist: artistName, limit: String(limit) });
  if (!data?.toptracks?.track) return [];
  return data.toptracks.track.map((t: any) => ({
    name: t.name ?? 'Unknown',
    playcount: t.playcount ?? '0',
    listeners: t.listeners ?? '0',
    artist: t.artist?.name ?? artistName,
    image: t.image?.find((i: any) => i.size === 'medium')?.['#text'] ?? '',
  }));
}
