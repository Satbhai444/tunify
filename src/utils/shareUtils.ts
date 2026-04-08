import { Share } from 'react-native';
import { Track } from '../types';

// Deep link base — tunify://song/<id> format
// When another Tunify user opens this link, the app will parse the song ID and play it

const APP_SCHEME = 'tunify';
const WEB_DOMAIN = 'https://tunify-music.app';

/**
 * Generate a shareable deep link for a song
 * We use a web URL so messaging apps (WhatsApp, Instagram, etc) make it clickable (blue).
 */
export function getSongLink(track: Track): string {
  return `${WEB_DOMAIN}/song/${encodeURIComponent(track.id)}`;
}

/**
 * Share a song with a deep link so receivers can open it in Tunify
 */
export async function shareSong(track: Track) {
  const link = getSongLink(track);
  await Share.share({
    message: `🎵 Listen to "${track.title}" by ${track.artist} on Tunify!\n\n🔗 ${link}`,
  });
}

/**
 * Share a specific lyric line with a deep link to the song
 */
export async function shareLyric(track: Track, lyricText: string) {
  const link = getSongLink(track);
  const card = `╭───────────────────╮
  "${lyricText}"
╰───────────────────╯

🎵 ${track.title} 
👤 ${track.artist}

Listen on Tunify:
🔗 ${link}`;

  await Share.share({
    message: card,
  });
}

/**
 * Share a playlist with deep link
 */
export async function sharePlaylist(title: string, trackCount: number, playlistId?: string) {
  const link = playlistId ? `${WEB_DOMAIN}/playlist/${encodeURIComponent(playlistId)}` : '';
  await Share.share({
    message: `🎶 Check out the playlist "${title}" (${trackCount} songs) on Tunify!${link ? '\n\n🔗 ' + link : ''}`,
  });
}

/**
 * Parse a Tunify deep link URL
 * Returns { type: 'song'|'playlist', id: string } or null
 */
export function parseDeepLink(url: string): { type: 'song' | 'playlist'; id: string } | null {
  try {
    // Handle tunify://song/xxx OR https://tunify-music.app/song/xxx
    const match = url.match(/(?:tunify:\/\/|https:\/\/tunify-music\.app\/)(song|playlist)\/(.+)/);
    if (match) {
      return { type: match[1] as 'song' | 'playlist', id: decodeURIComponent(match[2]) };
    }
    return null;
  } catch {
    return null;
  }
}
