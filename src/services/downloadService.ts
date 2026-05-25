import * as FileSystem from 'expo-file-system';
import { Track, DownloadedTrack } from '../types';
import { useLibraryStore } from '../stores';

const DOWNLOAD_DIR = `${FileSystem.documentDirectory}downloads/`;

export const downloadService = {
  /**
   * Initializes the download directory
   */
  init: async () => {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
    }
  },

  /**
   * Downloads a track and saves it to local storage
   */
  downloadTrack: async (track: Track, onProgress?: (progress: number) => void): Promise<DownloadedTrack> => {
    await downloadService.init();

    const fileExtension = track.url.split('.').pop()?.split('?')[0] || 'mp3';
    const fileName = `${track.id}.${fileExtension}`;
    const fileUri = `${DOWNLOAD_DIR}${fileName}`;

    const downloadResumable = FileSystem.createDownloadResumable(
      track.url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgress) onProgress(progress);
      }
    );

    try {
      console.log(`[DownloadService] Starting download from: ${track.url}`);
      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download result was empty');

      console.log(`[DownloadService] Download completed to: ${result.uri}`);
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      
      const downloadedTrack: DownloadedTrack = {
        ...track,
        localPath: result.uri,
        downloadedAt: Date.now(),
        fileSize: (fileInfo as any).size || 0,
      };

      // Add to library store
      await useLibraryStore.getState().addDownload(downloadedTrack);

      return downloadedTrack;
    } catch (e) {
      console.error('[DownloadService] Download error detail:', e);
      throw e;
    }
  },

  /**
   * Deletes a downloaded track
   */
  deleteDownload: async (trackId: string) => {
    const downloads = useLibraryStore.getState().downloads;
    const track = downloads.find(d => d.id === trackId);
    
    if (track && track.localPath) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(track.localPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(track.localPath);
        }
      } catch (e) {
        console.error('Delete file error:', e);
      }
    }

    await useLibraryStore.getState().removeDownload(trackId);
  },

  /**
   * Clears all downloads
   */
  clearAllDownloads: async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(DOWNLOAD_DIR, { idempotent: true });
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR);
      }
      
      // Clear store (logic should be in store, but we can iterate)
      const downloads = useLibraryStore.getState().downloads;
      for (const d of downloads) {
        await useLibraryStore.getState().removeDownload(d.id);
      }
    } catch (e) {
      console.error('Clear downloads error:', e);
    }
  }
};
