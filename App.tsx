import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {PlayerProvider} from './src/context/PlayerContext';
import MiniPlayer from './src/components/MiniPlayer';
import NowPlaying from './src/components/NowPlaying';
import MyMusicScreen from './src/screens/MyMusicScreen';
import YouTubeScreen from './src/screens/YouTubeScreen';
import PlaylistsScreen from './src/screens/PlaylistsScreen';

const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1DB954',
    background: '#121212',
    card: '#1a1a1a',
    text: '#ffffff',
    border: '#333',
    notification: '#1DB954',
  },
};

export default function App() {
  return (
    <PlayerProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              let iconName = 'musical-notes';
              if (route.name === 'Music')
                iconName = focused ? 'musical-notes' : 'musical-notes-outline';
              else if (route.name === 'YouTube') iconName = 'logo-youtube';
              else if (route.name === 'Playlists')
                iconName = focused ? 'list' : 'list-outline';
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1DB954',
            tabBarInactiveTintColor: '#b3b3b3',
            tabBarStyle: {
              backgroundColor: '#1a1a1a',
              borderTopColor: '#333',
              height: 56,
              paddingBottom: 4,
            },
            headerStyle: {backgroundColor: '#121212'},
            headerTintColor: '#fff',
          })}>
          <Tab.Screen
            name="Music"
            component={MyMusicScreen}
            options={{title: 'My Music'}}
          />
          <Tab.Screen name="YouTube" component={YouTubeScreen} />
          <Tab.Screen name="Playlists" component={PlaylistsScreen} />
        </Tab.Navigator>
        <MiniPlayer />
        <NowPlaying />
      </NavigationContainer>
    </PlayerProvider>
  );
}
