import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
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
import { usePlayerStore } from '../stores';
import { parseDeepLink } from '../utils/shareUtils';
import { getSongDetails } from '../api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <MaterialIcon name={name as any} size={size} color={color} />;
}

function HomeTabs() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const nav = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 30,
            left: 20,
            right: 20,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: 0,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={80}
              tint="dark"
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 32,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
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
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: focused ? colors.primary : 'rgba(255, 255, 255, 0.05)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: focused ? 10 : 0,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
              }}>
                <TabBarIcon name="search" color={focused ? '#FFF' : color} size={28} />
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

      {currentTrack && (
        <View style={{ position: 'absolute', bottom: 105, left: 10, right: 10 }}>
           <MiniPlayer onPress={() => nav.navigate('Player')} />
        </View>
      )}
    </View>
  );
}

// Deep linking config
const linking = {
  prefixes: ['tunify://'],
};

export function AppNavigator() {
  const navigationRef = React.useRef<any>(null);

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
