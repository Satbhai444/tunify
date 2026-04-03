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
} from 'react-native';
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
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
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
                    size={22}
                    color={
                      opt.destructive
                        ? colors.error
                        : opt.color || colors.primary
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
                <MaterialIcon name="chevron-right" size={18} color={colors.outline} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
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
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handleBar} />

          <Text style={styles.pickerTitle}>Add to Playlist</Text>

          {/* Create New */}
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
                placeholderTextColor={colors.outline}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                onSubmitEditing={handleCreate}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <MaterialIcon name="check" size={22} color={colors.onPrimaryContainer} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCreating(false);
                  setNewName('');
                }}
              >
                <MaterialIcon name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Existing playlists */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}
          >
            {playlists.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcon name="queue-music" size={40} color={colors.outline} />
                <Text style={styles.emptyText}>No playlists yet</Text>
                <Text style={styles.emptyHint}>Create one above to get started</Text>
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
        </Pressable>
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
        <Pressable style={[styles.sheet, { maxHeight: SCREEN_HEIGHT * 0.7 }]} onPress={(e) => e.stopPropagation()}>
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
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcon name="play-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 14,
  },
  sheetArt: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  sheetSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.xl,
    marginVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    gap: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(114,254,143,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionLabel: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  optionSublabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  // Playlist picker
  pickerTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontWeight: '800',
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 14,
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.primary,
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
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    gap: 8,
  },
  createInput: {
    flex: 1,
    height: 46,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 14,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  playlistCount: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    ...typography.titleSm,
    color: colors.onSurfaceVariant,
  },
  emptyHint: {
    ...typography.bodySm,
    color: colors.outline,
  },
  // Queue viewer
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 4,
  },
  queueCount: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    gap: 12,
  },
  queueRowActive: {
    backgroundColor: 'rgba(114,254,143,0.06)',
    borderRadius: radii.sm,
    marginHorizontal: 8,
    paddingHorizontal: 12,
  },
  queueIndex: {
    width: 24,
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  queueArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  queueTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  queueArtist: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
});
