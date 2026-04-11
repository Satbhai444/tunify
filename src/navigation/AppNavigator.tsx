import React from 'react';
import { View, StyleSheet, Linking, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { colors } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { MiniPlayer } from '../components/MiniPlayer';
import {
  SplashScreen,
  HomeScreen,
  SearchScreen,
  PlayerScreen,
  LibraryScreen,
  PlaylistDetailScreen,
  SettingsScreen,
  LikedSongsScreen,
  ArtistDetailScreen,
  AlbumDetailScreen,
  HistoryScreen,
  OnboardingScreen,
  BlendScreen,
  DiscoverScreen,
  MoodScreen,
  CreditsScreen,
  WelcomeScreen,
  PrivacyPolicyScreen,
  TermsScreen,
  HowToUseScreen,
} from '../screens';
import { usePlayerStore, useSettingsStore } from '../stores';
import { RatingModal } from '../components/RatingModal';
// Native modules loaded dynamically to prevent boot errors if missing
let MediaLibrary: any;
let Notifications: any;
try {
  MediaLibrary = require('expo-media-library');
  Notifications = require('expo-notifications');
} catch (e) {
  // Gracefully handle missing modules
}
import { WhatsNewModal } from '../components/WhatsNewModal';
import * as Updates from 'expo-updates';
import { parseDeepLink } from '../utils/shareUtils';
import { getSongDetails } from '../api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <MaterialIcon name={name as any} size={size} color={color} />;
}

function HomeTabs() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { themeMode } = useSettingsStore();
  const nav = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: themeMode === 'dark' ? '#16162E' : '#FFFFFF',
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={Platform.OS === 'ios' ? 40 : 100}
              tint={themeMode === 'dark' ? 'dark' : 'light'}
              style={{
                ...StyleSheet.absoluteFillObject,
                opacity: 0.98,
                borderTopWidth: 1,
                borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <TabBarIcon name="home-filled" color={color} size={28} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 }} />}
              </View>
            ),
          }}
          listeners={{
            tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
          }}
        />
        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <TabBarIcon name="explore" color={color} size={28} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 }} />}
              </View>
            ),
          }}
          listeners={{
            tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                width: 54, 
                height: 54, 
                borderRadius: 27, 
                backgroundColor: focused ? colors.primary : 'rgba(255, 255, 255, 0.05)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
                borderWidth: 1.5,
                borderColor: focused ? colors.primary : 'rgba(255,255,255,0.1)',
                elevation: focused ? 10 : 0,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: focused ? 0.3 : 0,
                shadowRadius: 8,
              }}>
                <TabBarIcon name="search" color={focused ? '#FFF' : color} size={28} />
              </View>
            ),
          }}
          listeners={{
            tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <TabBarIcon name="history" color={color} size={28} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 }} />}
              </View>
            ),
          }}
          listeners={{
            tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
          }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <TabBarIcon name="library-music" color={color} size={28} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 }} />}
              </View>
            ),
          }}
          listeners={{
            tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

// Deep linking config
const linking = {
  prefixes: ['tunify://', 'https://tunify-music.app'],
};

export function AppNavigator() {
  const navigationRef = React.useRef<any>(null);
  const initPlayer = usePlayerStore((s) => s.initPlayer);
  const { launchCount, incrementLaunchCount, hasRated, setHasRated, themeMode, lastSeenUpdateId, setLastSeenUpdateId } = useSettingsStore();
  const [showRating, setShowRating] = React.useState(false);
  const [showWhatsNew, setShowWhatsNew] = React.useState(false);
  const [currentRoute, setCurrentRoute] = React.useState<string | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  // Initialize TrackPlayer and Startup Logic
  React.useEffect(() => {
    initPlayer();
    
    // Increment launch count
    incrementLaunchCount();
    const newCount = launchCount + 1;

    // Check for updates or major overhaul reveal
    const checkUpdates = async () => {
      try {
        // 1. Handle "What's New" Reveal
        // In development, updateId might be null. In production, it's a UUID.
        const currentUpdateId = Updates.updateId || 'overhaul_v1'; 
        if (lastSeenUpdateId !== currentUpdateId) {
          setShowWhatsNew(true);
        }

        // 2. Check for waiting updates while the app is running
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            'Premium Update Ready',
            'A new premium update is ready for tunify. Restart now to experience the latest features?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart Now', onPress: () => Updates.reloadAsync() }
            ]
          );
        }
      } catch (e) {
        // Silent fail
      }
    };

    checkUpdates();

    // Request permissions on first few launches
    if (newCount <= 2) {
      (async () => {
        try {
          if (MediaLibrary) {
            const hasMedia = await MediaLibrary.getPermissionsAsync().catch(() => null);
            if (hasMedia) await MediaLibrary.requestPermissionsAsync();
          }
          if (Notifications) {
            const hasNotif = await Notifications.getPermissionsAsync().catch(() => null);
            if (hasNotif) await Notifications.requestPermissionsAsync();
          }
        } catch (e) {
          if (__DEV__) console.log('Permission request skipped (native module may be missing)', e);
        }
      })();
    }

    // Trigger rating modal if used 3+ times and hasn't rated
    if (newCount >= 3 && !hasRated) {
      setTimeout(() => setShowRating(true), 5000); // Show after 5s
    }
  }, [initPlayer]);

  // Handle deep links (tunify://song/xxx)
  React.useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const parsed = parseDeepLink(event.url);
      if (!parsed) return;

      if (parsed.type === 'song') {
        try {
          const songData = await getSongDetails(parsed.id);
          if (songData) {
            usePlayerStore.getState().play(songData, [songData]);
            // Small delay to let navigation mount
            setTimeout(() => {
              navigationRef.current?.navigate('Player');
            }, 300);
          }
        } catch {
          Alert.alert('Error', 'Could not load this song.');
        }
      } else if (parsed.type === 'playlist') {
        setTimeout(() => {
          navigationRef.current?.navigate('PlaylistDetail', {
            playlistId: parsed.id,
            title: 'Shared Playlist',
          });
        }, 300);
      }
    };

    // Handle link that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle link while app is open
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const hideMiniPlayer = ['Player', 'Splash', 'Welcome', 'Onboarding'].includes(currentRoute || '');

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linking}
      onStateChange={() => {
        const route = navigationRef.current?.getCurrentRoute();
        if (route) setCurrentRoute(route.name);
      }}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={HomeTabs} />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="LikedSongs" component={LikedSongsScreen} />
          <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
          <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Blend" component={BlendScreen} />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen name="Mood" component={MoodScreen} />
          <Stack.Screen name="Credits" component={CreditsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="HowToUseGuide" component={HowToUseScreen} />
        </Stack.Navigator>

        {!!currentTrack && !hideMiniPlayer && (
          <View style={[styles.globalMiniPlayer, { bottom: currentRoute === 'Main' ? (Platform.OS === 'ios' ? 170 : 160) : 20 }]}>
             <MiniPlayer onPress={() => navigationRef.current?.navigate('Player')} />
          </View>
        )}
      </View>

      <RatingModal 
        visible={showRating} 
        onClose={() => setShowRating(false)} 
        onRate={() => { setHasRated(true); setShowRating(false); }}
        themeMode={themeMode}
      />
      <WhatsNewModal 
        visible={showWhatsNew} 
        onClose={() => {
          setShowWhatsNew(false);
          setLastSeenUpdateId(Updates.updateId || 'overhaul_v1');
        }} 
        themeMode={themeMode}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  globalMiniPlayer: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 9999,
  },
});
