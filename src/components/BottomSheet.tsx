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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { colors, typography, spacing, radii } from '../theme';
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint="dark" style={styles.glassSheet}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header with track info */}
            {(title || artwork) && (
              <View style={styles.sheetHeader}>
                {artwork && (
                  <Image source={{ uri: artwork }} style={styles.sheetArt} contentFit="cover" />
                )}
                <View style={styles.sheetHeaderText}>
                  {title && (
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text style={styles.sheetSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.divider} />

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
                      opt.destructive && { backgroundColor: 'rgba(255,113,81,0.12)' },
                    ]}
                  >
                    <MaterialIcon
                      name={opt.icon as any}
                      size={20}
                      color={
                        opt.destructive
                          ? colors.error
                          : opt.color || '#FFF'
                      }
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionLabel,
                        opt.destructive && { color: colors.error },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {opt.sublabel && (
                      <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                    )}
                  </View>
                  <MaterialIcon name="chevron-right" size={18} color="#5C5C8A" />
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
  playlists: { id: string; title: string; trackCount: number }[];
  onSelect: (playlistId: string) => void;
  onCreate: (name: string) => void;
}

export function PlaylistPicker({
  visible,
  onClose,
  playlists,
  onSelect,
  onCreate,
}: PlaylistPickerProps) {
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  function handleCreate() {
    const name = newName.trim();
    if (name) {
      onCreate(name);
      setNewName('');
      setCreating(false);
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint="dark" style={styles.glassSheet}>
            <View style={styles.handleBar} />
            <Text style={styles.pickerTitle}>Add to Playlist</Text>

            {!creating ? (
              <TouchableOpacity
                style={styles.createRow}
                onPress={() => setCreating(true)}
                activeOpacity={0.7}
              >
                <View style={styles.createIcon}>
                  <MaterialIcon name="add" size={24} color={colors.primary} />
                </View>
                <Text style={styles.createText}>Create New Playlist</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.createInputRow}>
                <TextInput
                  style={styles.createInput}
                  placeholder="Playlist name..."
                  placeholderTextColor="#A5A5C7"
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  onSubmitEditing={handleCreate}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                  <MaterialIcon name="check" size={22} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setCreating(false);
                    setNewName('');
                  }}
                >
                  <MaterialIcon name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.divider} />

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}
            >
              {playlists.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcon name="queue-music" size={40} color="#5C5C8A" />
                  <Text style={styles.emptyText}>No playlists yet</Text>
                </View>
              ) : (
                playlists.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.playlistRow}
                    onPress={() => {
                      onSelect(p.id);
                      onClose();
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={styles.playlistIcon}>
                      <MaterialIcon name="queue-music" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName} numberOfLines={1}>
                        {p.title}
                      </Text>
                      <Text style={styles.playlistCount}>
                        {p.trackCount} {p.trackCount === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>
                    <MaterialIcon name="add-circle-outline" size={22} color={colors.primary} />
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
interface QueueViewerProps {
  visible: boolean;
  onClose: () => void;
  queue: { id: string; title: string; artist: string; artwork: string }[];
  currentTrackId?: string;
  onPlayTrack?: (index: number) => void;
}

export function QueueViewer({ visible, onClose, queue, currentTrackId, onPlayTrack }: QueueViewerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <BlurView intensity={40} tint="dark" style={[styles.glassSheet, { maxHeight: SCREEN_HEIGHT * 0.8 }]}>
            <View style={styles.handleBar} />
            <View style={styles.queueHeader}>
              <Text style={styles.pickerTitle}>Queue</Text>
              <Text style={styles.queueCount}>{queue.length} songs</Text>
            </View>
            <View style={styles.divider} />
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {queue.map((track, i) => {
                const isActive = track.id === currentTrackId;
                return (
                  <TouchableOpacity
                    key={`${track.id}_${i}`}
                    style={[styles.queueRow, isActive && styles.queueRowActive]}
                    onPress={() => {
                      if (!isActive && onPlayTrack) {
                        onPlayTrack(i);
                        onClose();
                      }
                    }}
                    activeOpacity={isActive ? 1 : 0.6}
                  >
                    <Text style={[styles.queueIndex, isActive && { color: colors.primary }]}>
                      {isActive ? '▶' : i + 1}
                    </Text>
                    <Image
                      source={{ uri: track.artwork }}
                      style={styles.queueArt}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.queueTitle, isActive && { color: colors.primary }]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <Text style={styles.queueArtist} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    {isActive ? (
                      <MaterialIcon name="equalizer" size={18} color={colors.primary} />
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          if (onPlayTrack) {
                            onPlayTrack(i);
                            onClose();
                          }
                        }}
                      >
                        <MaterialIcon name="play-circle-outline" size={24} color={colors.primary} />
                      </TouchableOpacity>
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

// ─── Styles ───
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  glassSheet: {
    paddingBottom: 40,
    backgroundColor: 'rgba(22, 22, 46, 0.7)',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  sheetArt: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.titleMd,
    color: '#FFF',
    fontWeight: '700',
  },
  sheetSubtitle: {
    ...typography.bodySm,
    color: '#A5A5C7',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 24,
    marginVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    ...typography.titleSm,
    color: '#FFF',
    fontWeight: '600',
  },
  optionSublabel: {
    ...typography.labelSm,
    color: '#A5A5C7',
    marginTop: 1,
  },
  pickerTitle: {
    ...typography.headlineSm,
    color: '#FFF',
    fontWeight: '800',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 97, 255, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    ...typography.titleSm,
    color: colors.primary,
    fontWeight: '700',
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  createInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  playlistIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...typography.titleSm,
    color: '#FFF',
    fontWeight: '600',
  },
  playlistCount: {
    ...typography.labelSm,
    color: '#A5A5C7',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    ...typography.titleSm,
    color: '#A5A5C7',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  queueCount: {
    ...typography.bodySm,
    color: '#A5A5C7',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
  },
  queueRowActive: {
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    borderRadius: 16,
    marginHorizontal: 12,
    paddingHorizontal: 12,
  },
  queueIndex: {
    width: 20,
    ...typography.bodySm,
    color: '#A5A5C7',
    textAlign: 'center',
  },
  queueArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  queueTitle: {
    ...typography.titleSm,
    color: '#FFF',
    fontWeight: '600',
  },
  queueArtist: {
    ...typography.labelSm,
    color: '#A5A5C7',
    marginTop: 2,
  },
});
