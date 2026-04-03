// Audio is now handled by expo-av in playerStore.ts
// These are kept as no-ops for backward compatibility

export async function setupPlayer(): Promise<boolean> {
  return true;
}

export async function playbackService() {
  // No-op: expo-av handles playback events internally
}
