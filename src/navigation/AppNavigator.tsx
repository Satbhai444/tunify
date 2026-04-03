import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { MaterialIcon } from '../components/MaterialIcon';
import { MiniPlayer } from '../components/MiniPlayer';
import {
  SplashScreen,
  AuthScreen,
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
} from '../screens';
import { usePlayerStore } from '../stores';

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
            backgroundColor: 'rgba(14, 14, 14, 0.95)',
            borderTopColor: colors.surfaceContainerHighest,
            borderTopWidth: 0.5,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="home-filled" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="search" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            tabBarLabel: 'Your Library',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="library-music" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* MiniPlayer overlay - shown above tab bar when track is playing */}
      {currentTrack && (
        <MiniPlayer onPress={() => nav.navigate('Player')} />
      )}
    </View>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
