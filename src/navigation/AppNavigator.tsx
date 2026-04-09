import React from 'react';
import { View, StyleSheet, Linking, Alert, Platform } from 'react-native';
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
} from '../screens';
import { usePlayerStore, useSettingsStore } from '../stores';
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
        />
      </Tab.Navigator>

      {!!currentTrack && (
        <View style={{ position: 'absolute', bottom: Platform.OS === 'ios' ? 170 : 160, left: 10, right: 10, zIndex: 9999 }}>
           <MiniPlayer onPress={() => nav.navigate('Player')} />
        </View>
      )}
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

  // Initialize TrackPlayer on startup
  React.useEffect(() => {
    initPlayer();
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

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
