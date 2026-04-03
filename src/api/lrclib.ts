// LRCLIB - Free public API for synced lyrics (LRC format)
// No API key required

export interface SyncedLyricLine {
  time: number; // seconds
  text: string;
}

const BASE_URL = 'https://lrclib.net/api';

export async function getSyncedLyrics(
  title: string,
  artist: string,
  durationSec?: number
): Promise<SyncedLyricLine[]> {
  try {
    // Try exact match first
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    if (durationSec && durationSec > 0) {
      params.set('duration', String(Math.round(durationSec)));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/get?${params.toString()}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Tunify/1.0.0' },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        return parseLRC(data.syncedLyrics);
      }
      // Fall back to plain lyrics
      if (data.plainLyrics) {
        return parsePlainLyrics(data.plainLyrics);
      }
    }

    // Fallback: search API
    const searchRes = await fetchWithTimeout(
      `${BASE_URL}/search?q=${encodeURIComponent(`${title} ${artist}`)}`
    );
    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        const best = results[0];
        if (best.syncedLyrics) {
          return parseLRC(best.syncedLyrics);
        }
        if (best.plainLyrics) {
          return parsePlainLyrics(best.plainLyrics);
        }
      }
    }

    return [];
  } catch {
    return [];
  }
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Tunify/1.0.0' },
    });
  } finally {
    clearTimeout(timeout);
  }
}

// Parse LRC format: [mm:ss.xx] text
function parseLRC(lrc: string): SyncedLyricLine[] {
  const lines: SyncedLyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)/;

  for (const raw of lrc.split('\n')) {
    const match = raw.match(regex);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const time = min * 60 + sec + ms / 1000;
      const text = match[4].trim();
      if (text.length > 0) {
        lines.push({ time, text });
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

// Parse plain lyrics (no timestamps) — approximate 3s per line
function parsePlainLyrics(text: string): SyncedLyricLine[] {
  return text
    .split('\n')
    .map((line, i) => ({ time: i * 3, text: line.trim() }))
    .filter((l) => l.text.length > 0);
}
