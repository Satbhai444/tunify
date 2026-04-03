export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number; // in seconds
  artwork: string;  // URL
  url: string;      // streaming URL
  source: 'jiosaavn' | 'deezer';
  hasLyrics?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  artwork: string;
  year?: string;
  trackCount?: number;
  source: 'jiosaavn' | 'deezer';
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  followerCount?: number;
  source: 'jiosaavn' | 'deezer';
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  artwork: string;
  trackCount: number;
  tracks?: Track[];
  createdBy?: string;
  isUserCreated?: boolean;
  source: 'jiosaavn' | 'deezer' | 'local';
}

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface UserPlaylist {
  id: string;
  title: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  artwork?: string;
}

export interface DownloadedTrack extends Track {
  localPath: string;
  downloadedAt: number;
  fileSize: number;
}
