import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  ToastAndroid,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, darkColors, lightColors, typography, spacing, radii } from '../theme';
import { useSettingsStore } from '../stores/settingsStore';
import { useLibraryStore, usePlayerStore } from '../stores';
import { MaterialIcon } from './MaterialIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Menu Option ───
export interface MenuOption {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
}

interface BottomSheetMenuProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  artwork?: string;
  options: MenuOption[];
}

export function BottomSheetMenu({
  visible,
  onClose,
  title,
  subtitle,
  artwork,
  options,
}: BottomSheetMenuProps) {
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.glassSheet, { backgroundColor: themeMode === 'dark' ? 'rgba(22, 22, 46, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
            {/* Handle bar */}
            <View style={[styles.handleBar, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Header with track info */}
            {!!(title || artwork) && (
              <View style={styles.sheetHeader}>
                {artwork && (
                  <Image source={{ uri: artwork }} style={styles.sheetArt} contentFit="cover" />
                )}
                <View style={styles.sheetHeaderText}>
                  {title && (
                    <Text style={[styles.sheetTitle, { color: theme.onSurface }]} numberOfLines={1}>
                      {title}
                    </Text>
                  )}
                  {!!subtitle && (
                    <Text style={[styles.sheetSubtitle, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            {/* Options */}
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}
            >
              {options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.optionRow}
                  onPress={() => {
                    opt.onPress();
                    onClose();
                  }}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                      opt.destructive && { backgroundColor: 'rgba(255,113,81,0.12)' },
                    ]}
                  >
                    <MaterialIcon
                      name={opt.icon as any}
                      size={20}
                      color={
                        opt.destructive
                          ? theme.error
                          : opt.color || theme.onSurface
                      }
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: theme.onSurface },
                        opt.destructive && { color: theme.error },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {!!opt.sublabel && (
                      <Text style={[styles.optionSublabel, { color: theme.onSurfaceVariant }]}>{opt.sublabel}</Text>
                    )}
                  </View>
                  <MaterialIcon name="chevron-right" size={18} color={theme.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Playlist Picker ───
interface PlaylistPickerProps {
  visible: boolean;
  onClose: () => void;
  track?: any;
}

export function PlaylistPicker({
  visible,
  onClose,
  track,
}: PlaylistPickerProps) {
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  const playlists = useLibraryStore((s: any) => s.playlists);
  const addToPlaylist = useLibraryStore((s: any) => s.addToPlaylist);
  const createPlaylist = useLibraryStore((s: any) => s.createPlaylist);
  
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  function handleCreate() {
    const name = newName.trim();
    if (name) {
      createPlaylist(name);
      setNewName('');
      setCreating(false);
    }
  }

  function handleSelect(pid: string) {
    if (track) {
      addToPlaylist(pid, track.id);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Added to playlist', ToastAndroid.SHORT);
      }
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.glassSheet, { backgroundColor: themeMode === 'dark' ? 'rgba(22, 22, 46, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
            <View style={[styles.handleBar, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
            <Text style={[styles.pickerTitle, { color: theme.onSurface }]}>Add to Playlist</Text>

            {!creating ? (
              <TouchableOpacity
                style={styles.createRow}
                onPress={() => setCreating(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.createIcon, { borderColor: theme.primary }]}>
                  <MaterialIcon name="add" size={24} color={theme.primary} />
                </View>
                <Text style={[styles.createText, { color: theme.primary }]}>Create New Playlist</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.createInputRow}>
                <TextInput
                  style={[styles.createInput, { color: theme.onSurface, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.primary }]}
                  placeholder="Playlist name..."
                  placeholderTextColor={theme.onSurfaceVariant}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  onSubmitEditing={handleCreate}
                  returnKeyType="done"
                />
                <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={handleCreate}>
                  <MaterialIcon name="check" size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                  onPress={() => {
                    setCreating(false);
                    setNewName('');
                  }}
                >
                  <MaterialIcon name="close" size={22} color={theme.onSurface} />
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}
            >
              {playlists.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcon name="queue-music" size={40} color={theme.onSurfaceVariant} />
                  <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>No playlists yet</Text>
                </View>
              ) : (
                playlists.map((p: any) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.playlistRow}
                    onPress={() => handleSelect(p.id)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.playlistIcon, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <MaterialIcon name="queue-music" size={22} color={theme.primary} />
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={[styles.playlistName, { color: theme.onSurface }]} numberOfLines={1}>
                        {p.title}
                      </Text>
                      <Text style={[styles.playlistCount, { color: theme.onSurfaceVariant }]}>
                        {p.trackIds.length} {p.trackIds.length === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>
                    <MaterialIcon name="add-circle-outline" size={22} color={theme.primary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </BlurView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Queue Viewer ───
export function QueueViewer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { themeMode } = useSettingsStore();
  const theme = themeMode === 'dark' ? darkColors : lightColors;
  const { queue, currentTrack, play } = usePlayerStore();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint={themeMode === 'dark' ? 'dark' : 'light'} style={[styles.glassSheet, { backgroundColor: themeMode === 'dark' ? 'rgba(22, 22, 46, 0.7)' : 'rgba(255, 255, 255, 0.7)', maxHeight: SCREEN_HEIGHT * 0.8 }]}>
            <View style={[styles.handleBar, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
            <View style={styles.queueHeader}>
              <Text style={[styles.pickerTitle, { color: theme.onSurface }]}>Queue</Text>
              <Text style={[styles.queueCount, { color: theme.onSurfaceVariant }]}>{queue.length} songs</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {queue.map((track: any, i: number) => {
                const isActive = track.id === currentTrack?.id;
                return (
                  <TouchableOpacity
                    key={`${track.id}_${i}`}
                    style={[styles.queueRow, isActive && [styles.queueRowActive, { backgroundColor: themeMode === 'dark' ? 'rgba(123, 97, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)' }]]}
                    onPress={() => {
                      if (!isActive) {
                        play(track, queue);
                        onClose();
                      }
                    }}
                    activeOpacity={isActive ? 1 : 0.6}
                  >
                    <Text style={[styles.queueIndex, { color: theme.onSurfaceVariant }, isActive && { color: theme.primary }]}>
                      {isActive ? '▶' : i + 1}
                    </Text>
                    <Image
                      source={{ uri: track.artwork }}
                      style={styles.queueArt}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.queueTitle, { color: theme.onSurface }, isActive && { color: theme.primary }]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text style={[styles.queueArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    {isActive ? (
                      <MaterialIcon name="equalizer" size={18} color={theme.primary} />
                    ) : (
                       <MaterialIcon name="play-circle-outline" size={24} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </BlurView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  glassSheet: { paddingBottom: 40 },
  handleBar: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 16 },
  sheetArt: { width: 56, height: 56, borderRadius: 12 },
  sheetHeaderText: { flex: 1 },
  sheetTitle: { ...typography.titleMd, fontWeight: '700' },
  sheetSubtitle: { ...typography.bodySm, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 24, marginVertical: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, gap: 16 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionTextCol: { flex: 1 },
  optionLabel: { ...typography.titleSm, fontWeight: '600' },
  optionSublabel: { ...typography.labelSm, marginTop: 1 },
  pickerTitle: { ...typography.headlineSm, fontWeight: '800', paddingHorizontal: 24, paddingVertical: 16 },
  createRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 16 },
  createIcon: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  createText: { ...typography.titleSm, fontWeight: '700' },
  createInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8, gap: 8 },
  createInput: { flex: 1, height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, fontWeight: '500', borderWidth: 1 },
  createBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  playlistRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 16 },
  playlistIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playlistInfo: { flex: 1 },
  playlistName: { ...typography.titleSm, fontWeight: '600' },
  playlistCount: { ...typography.labelSm, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { ...typography.titleSm },
  queueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 4 },
  queueCount: { ...typography.bodySm },
  queueRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 16 },
  queueRowActive: { borderRadius: 16, marginHorizontal: 12, paddingHorizontal: 12 },
  queueIndex: { width: 20, ...typography.bodySm, textAlign: 'center' },
  queueArt: { width: 44, height: 44, borderRadius: 8 },
  queueTitle: { ...typography.titleSm, fontWeight: '600' },
  queueArtist: { ...typography.labelSm, marginTop: 2 },
});
