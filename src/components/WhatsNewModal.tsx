import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcon } from './MaterialIcon';
import { typography, colors, darkColors, lightColors } from '../theme';

interface WhatsNewModalProps {
  visible: boolean;
  onClose: () => void;
  themeMode: 'dark' | 'light';
}

const HIGHLIGHTS = [
  {
    title: 'Premium Glass UI',
    description: 'Experience a completely modernized interface with stunning glassmorphism effects and smooth gradients.',
    icon: 'auto-awesome',
    color: ['#7C3AED', '#4F39CC'] as [string, string],
  },
  {
    title: 'How to Use Guide',
    description: 'New to tunify? Explore our new step-by-step guide to master all the premium features.',
    icon: 'menu-book',
    color: ['#00C9FF', '#92FE9D'] as [string, string],
  },
  {
    title: 'Search Improvements',
    description: 'Take control of your library with individual search history removal and a cleaner search experience.',
    icon: 'manage-search',
    color: ['#FF6B6B', '#EE5A24'] as [string, string],
  },
  {
    title: 'Custom Audio Settings',
    description: 'Style your sound with our new Equalizer and Streaming Quality modals, designed to feel premium.',
    icon: 'tune',
    color: ['#F97316', '#B45309'] as [string, string],
  },
];

export function WhatsNewModal({ visible, onClose, themeMode }: WhatsNewModalProps) {
  const isDark = themeMode === 'dark';
  const theme = isDark ? darkColors : lightColors;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <LinearGradient colors={['#7C3AED', '#4F39CC']} style={styles.headerGradient}>
            <MaterialIcon name="celebration" size={32} color="#FFF" />
            <Text style={styles.headerTitle}>Premium Overhaul!</Text>
          </LinearGradient>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.intro, { color: theme.onSurfaceVariant }]}>
              Welcome to the all-new tunify. We've meticulously redesigned every corner to give you the most premium experience possible.
            </Text>

            {HIGHLIGHTS.map((item, idx) => (
              <View key={idx} style={styles.item}>
                <LinearGradient colors={item.color} style={styles.iconCircle}>
                  <MaterialIcon name={item.icon as any} size={24} color="#FFF" />
                </LinearGradient>
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, { color: theme.onSurface }]}>{item.title}</Text>
                  <Text style={[styles.itemDesc, { color: theme.onSurfaceVariant }]}>{item.description}</Text>
                </View>
              </View>
            ))}

            <View style={{ height: 20 }} />
          </ScrollView>

          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.doneBtnText}>Explore Now 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
  content: { width: '100%', maxHeight: '85%', borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  headerGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 30, paddingBottom: 24 },
  headerTitle: { ...typography.headlineSmall, color: '#FFF', fontWeight: '900' },
  scroll: { paddingHorizontal: 24, paddingTop: 20 },
  intro: { ...typography.bodyLarge, marginBottom: 30, lineHeight: 24, fontWeight: '500' },
  item: { flexDirection: 'row', gap: 16, marginBottom: 24, alignItems: 'flex-start' },
  iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemText: { flex: 1 },
  itemTitle: { ...typography.titleMedium, fontWeight: '800', marginBottom: 4 },
  itemDesc: { ...typography.bodyMedium, lineHeight: 20 },
  doneBtn: { margin: 24, marginTop: 10, paddingVertical: 18, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  doneBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
