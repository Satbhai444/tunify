import React from 'react';
import { AuthScreen } from '../screens/AuthScreen';
import { View, StyleSheet, Linking, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { darkColors, lightColors } from '../theme';
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
  const theme = themeMode === 'dark' ? darkColors : lightColors;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: theme.tabBarBg,
            borderTopWidth: 1,
            borderTopColor: theme.tabBarBorder,
            elevation: 0,
            shadowOpacity: 0,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.onSurfaceVariant,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: 'BebasNote',
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home-filled' : 'home'} color={color} size={26} />
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
            tabBarLabel: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'explore' : 'explore'} color={color} size={26} />
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
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="search" color={color} size={26} />
            ),
          }}
          listeners={{
            tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="history" color={color} size={26} />
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
            tabBarLabel: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'library-music' : 'library-music'} color={color} size={26} />
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

import { ErrorBoundary } from '../components/ErrorBoundary';

export function AppNavigator() {
  const navigationRef = React.useRef<any>(null);
  const initPlayer = usePlayerStore((s) => s.initPlayer);
  const { launchCount, incrementLaunchCount, hasRated, setHasRated, themeMode, lastSeenUpdateId, setLastSeenUpdateId } = useSettingsStore();
  const [showRating, setShowRating] = React.useState(false);
  const [showWhatsNew, setShowWhatsNew] = React.useState(false);
  const [currentRoute, setCurrentRoute] = React.useState<string | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const theme = themeMode === 'dark' ? darkColors : lightColors;

  // Initialize TrackPlayer and Startup Logic
  React.useEffect(() => {
    const startup = async () => {
      try {
        await initPlayer();
        incrementLaunchCount();
        const newCount = launchCount + 1;

        // Check for updates or major overhaul reveal
        const checkUpdates = async () => {
          try {
            // Safety Check: if Updates is missing or not configured
            if (!Updates.updateId && !Updates.manifest) {
              if (__DEV__) console.log('[Updates] Not configured or missing native module');
              return; 
            }

            const currentUpdateId = Updates.updateId || 'overhaul_v1'; 
            if (lastSeenUpdateId !== currentUpdateId) {
              setShowWhatsNew(true);
            }

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
            // Silent fail for updates
          }
        };

        // checkUpdates();

        // Trigger rating modal if used 3+ times and hasn't rated
        if (newCount >= 3 && !hasRated) {
          setTimeout(() => setShowRating(true), 5000); 
        }
      } catch (e) {
        console.error('[Startup] Critical boot error:', e);
      }
    };

    startup();
  }, [initPlayer]);

  // Handle deep links (tunify://song/xxx)
  React.useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      try {
        const parsed = parseDeepLink(event.url);
        if (!parsed) return;

        if (parsed.type === 'song') {
            const songData = await getSongDetails(parsed.id);
            if (songData) {
              usePlayerStore.getState().play(songData, [songData]);
              setTimeout(() => {
                navigationRef.current?.navigate('Player');
              }, 300);
            }
        } else if (parsed.type === 'playlist') {
          setTimeout(() => {
            navigationRef.current?.navigate('PlaylistDetail', {
              playlistId: parsed.id,
              title: 'Shared Playlist',
            });
          }, 300);
        }
      } catch (e) {}
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  const hideMiniPlayer = ['Player', 'Splash', 'Welcome', 'Onboarding'].includes(currentRoute || '');

  return (
    <ErrorBoundary>
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
              contentStyle: { backgroundColor: theme.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
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
            <View style={[styles.globalMiniPlayer, { 
              bottom: ['Home', 'Discover', 'Search', 'History', 'Library'].includes(currentRoute || '') ? 80 : 20 
            }]}>
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  globalMiniPlayer: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 9999,
  },
});
