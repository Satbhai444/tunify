import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  iconColor: string;
  gradient: [string, string];
  title: string;
  subtitle: string;
  highlight: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'music-note',
    iconColor: '#72fe8f',
    gradient: ['#0a2e14', '#0e0e0e'],
    title: 'Welcome to Tunify',
    subtitle: 'Unlimited premium music streaming with Bollywood, Hollywood, Punjabi, K-Pop, and more — No Ads, Ever.',
    highlight: 'Premium Experience',
  },
  {
    id: '2',
    icon: 'auto-awesome',
    iconColor: '#a78bfa',
    gradient: ['#1a0a2e', '#0e0e0e'],
    title: 'Personalized for You',
    subtitle: 'The more you listen, the better your recommendations get. Quick Picks, Made for You, and Discover — all tailored to your taste.',
    highlight: 'Smart recommendations',
  },
  {
    id: '3',
    icon: 'lyrics',
    iconColor: '#f59e0b',
    gradient: ['#2e1a0a', '#0e0e0e'],
    title: 'Sing Along',
    subtitle: 'Full-screen synced lyrics, equalizer, song radio, and a beautiful player experience.',
    highlight: 'Lyrics & Equalizer',
  },
  {
    id: '4',
    icon: 'cloud-download',
    iconColor: '#06b6d4',
    gradient: ['#0a1a2e', '#0e0e0e'],
    title: 'Listen Offline',
    subtitle: 'Download your favorite songs and listen anywhere — no internet needed.',
    highlight: 'Offline mode',
  },
];

export function WelcomeScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.replace('Onboarding');
    }
  };

  const handleSkip = () => {
    navigation.replace('Onboarding');
  };

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <View style={styles.slide}>
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />

      {/* Icon Container */}
      <View style={styles.iconArea}>
        <View style={[styles.iconGlow, { backgroundColor: item.iconColor + '15' }]}>
          <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '20', borderColor: item.iconColor + '30' }]}>
            <MaterialIcon name={item.icon as any} size={64} color={item.iconColor} />
          </View>
        </View>
      </View>

      {/* Text Area */}
      <View style={styles.textArea}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        <View style={[styles.highlightBadge, { backgroundColor: item.iconColor + '20' }]}>
          <Text style={[styles.highlightText, { color: item.iconColor }]}>{item.highlight}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomArea}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.8}>
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
            </Text>
            <MaterialIcon
              name={currentIndex === SLIDES.length - 1 ? 'celebration' : 'arrow-forward'}
              size={20}
              color={colors.background}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  slideSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  highlightBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  highlightText: {
    ...typography.labelLg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    backgroundColor: 'rgba(14,14,14,0.9)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    ...typography.titleSm,
    color: colors.onSurfaceVariant,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  nextText: {
    ...typography.titleSm,
    color: colors.background,
    fontWeight: '700',
  },
});
