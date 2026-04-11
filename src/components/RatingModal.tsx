import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcon } from './MaterialIcon';
import { typography, colors } from '../theme';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onRate: () => void;
  themeMode: 'dark' | 'light';
}

export function RatingModal({ visible, onClose, onRate, themeMode }: RatingModalProps) {
  const isDark = themeMode === 'dark';

  const handleRate = () => {
    onRate();
    // Simulate opening store (you can replace with actual store link later)
    if (Platform.OS === 'android') {
      Linking.openURL('https://daarshannexaa.in'); // Placeholder or specific play store link
    } else {
      Linking.openURL('https://daarshannexaa.in');
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.content, { backgroundColor: isDark ? '#1C1C3E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <LinearGradient colors={['#7C3AED', '#4F39CC']} style={styles.iconCircle}>
            <MaterialIcon name="star" size={40} color="#FFF" />
          </LinearGradient>

          <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>Loving tunify?</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A5A5C7' : '#666' }]}>
            Your feedback means the world to us! It only takes a few seconds to support our team's hard work.
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <MaterialIcon key={s} name="star" size={32} color="#FBBF24" />
            ))}
          </View>

          <TouchableOpacity style={[styles.rateBtn, { backgroundColor: colors.primary }]} onPress={handleRate}>
            <Text style={styles.rateBtnText}>Rate us 5 Stars! ⭐</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.maybeBtn} onPress={onClose}>
            <Text style={[styles.maybeBtnText, { color: isDark ? '#A5A5C7' : '#888' }]}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 30 },
  content: { width: '100%', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1 },
  iconCircle: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { ...typography.headlineSmall, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  subtitle: { ...typography.bodyMedium, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  rateBtn: { width: '100%', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  rateBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  maybeBtn: { marginTop: 20, paddingVertical: 10 },
  maybeBtnText: { fontSize: 16, fontWeight: '600' },
});
