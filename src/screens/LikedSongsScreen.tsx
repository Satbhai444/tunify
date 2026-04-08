import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ToastAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, darkColors, lightColors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { useLibraryStore, usePlayerStore, useSettingsStore } from '../stores';
import type { Track } from '../types';

export function LikedSongsScreen({ navigation }: any) {
  const likedSongs = useLibraryStore((s) => s.likedSongs);
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  function showToast(msg: string) {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient 
        colors={themeMode === 'dark' ? ['#7B61FF', '#0D0D1F'] : ['#A5B4FC', '#F8F9FE']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <FlatList
        data={likedSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.heroIconContainer, { backgroundColor: themeMode === 'dark' ? 'rgba(255,113,81,0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
               <MaterialIcon name="favorite" size={60} color={themeMode === 'dark' ? '#FFF' : '#EF4444'} />
               <BlurView intensity={20} tint={themeMode === 'dark' ? 'dark' : 'light'} style={styles.artOverlay} />
            </View>

            <View style={styles.infoSection}>
               <Text style={[styles.title, { color: theme.onSurface }]}>Liked Songs</Text>
               <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>{likedSongs.length} songs saved to your library</Text>
            </View>

            <View style={styles.controls}>
               <TouchableOpacity 
                 style={[styles.playBtn, { backgroundColor: theme.primary }]}
                 onPress={() => likedSongs.length > 0 && play(likedSongs[0], likedSongs)}
               >
                  <MaterialIcon name="play-arrow" size={32} color="#FFF" />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => showToast('Shuffle coming soon!')}>
                  <MaterialIcon name="shuffle" size={24} color={theme.onSurface} />
               </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
             <MaterialIcon name="favorite-border" size={64} color={theme.onSurfaceVariant} />
             <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>Your heart is empty</Text>
             <TouchableOpacity 
               style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
               onPress={() => navigation.navigate('Home')}
             >
                <Text style={styles.exploreBtnText}>Find some music</Text>
             </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = currentTrack?.id === item.id;
          return (
            <TouchableOpacity 
              style={styles.trackRow}
              onPress={() => play(item, likedSongs)}
            >
              <BlurView intensity={10} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.trackBlur, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <Image source={{ uri: item.artwork }} style={styles.trackArt} />
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.trackArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>{item.artist}</Text>
                </View>
                {isActive && <MaterialIcon name="equalizer" size={18} color={theme.primary} />}
                <TouchableOpacity onPress={() => toggleLike(item)}>
                  <MaterialIcon name="favorite" size={20} color={theme.error} />
                </TouchableOpacity>
              </BlurView>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
        onPress={() => navigation.goBack()}
      >
        <MaterialIcon name="arrow-back" size={24} color={theme.onSurface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 150 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 30 },
  backButton: { position: 'absolute', top: 50, left: 20, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  heroIconContainer: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', elevation: 20, overflow: 'hidden' },
  artOverlay: { ...StyleSheet.absoluteFillObject },
  infoSection: { alignItems: 'center', marginTop: 24, paddingHorizontal: 40 },
  title: { ...typography.headlineSm, fontWeight: '800', textAlign: 'center' },
  subtitle: { ...typography.bodySm, marginTop: 6, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 30, marginTop: 30 },
  playBtn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  trackRow: { marginHorizontal: 20, marginBottom: 10, borderRadius: 20, overflow: 'hidden' },
  trackBlur: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
  trackArt: { width: 48, height: 48, borderRadius: 12 },
  trackInfo: { flex: 1 },
  trackTitle: { ...typography.titleSm, fontWeight: '700' },
  trackArtist: { ...typography.labelSm, marginTop: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { ...typography.titleMd, marginTop: 20 },
  exploreBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  exploreBtnText: { ...typography.titleSm, color: '#FFF', fontWeight: '700' },
});
