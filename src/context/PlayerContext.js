import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlayerContext = createContext();
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [library, setLibrary] = useState([]);
  const soundRef = useRef(null);

  const currentSong = currentIndex >= 0 && currentIndex < songs.length ? songs[currentIndex] : null;

  // Load playlists from storage
  useEffect(() => {
    AsyncStorage.getItem('tunebox_playlists').then(data => {
      if (data) setPlaylists(JSON.parse(data));
    });
  }, []);

  // Save playlists
  useEffect(() => {
    AsyncStorage.setItem('tunebox_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Configure audio
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
  }, []);

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      setDuration(status.durationMillis / 1000 || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        if (repeat === 2) {
          soundRef.current?.replayAsync();
        } else {
          skipNext();
        }
      }
    }
  }, [repeat]);

  const playSong = useCallback(async (songList, index) => {
    setSongs(songList);
    setCurrentIndex(index);
    const song = songList[index];
    if (!song) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;

      // Add to library
      setLibrary(prev => {
        if (prev.find(s => s.id === song.id)) return prev;
        return [...prev, song];
      });
    } catch (e) {
      console.error('Play error:', e);
    }
  }, [onPlaybackStatusUpdate]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  }, [isPlaying]);

  const skipNext = useCallback(async () => {
    if (songs.length === 0) return;
    let next;
    if (shuffle) {
      next = Math.floor(Math.random() * songs.length);
    } else {
      next = (currentIndex + 1) % songs.length;
      if (next === 0 && repeat === 0) return;
    }
    await playSong(songs, next);
  }, [songs, currentIndex, shuffle, repeat, playSong]);

  const skipPrev = useCallback(async () => {
    if (songs.length === 0) return;
    if (currentTime > 3 && soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      return;
    }
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    await playSong(songs, prev);
  }, [songs, currentIndex, currentTime, playSong]);

  const seekTo = useCallback(async (time) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(time * 1000);
    }
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeat(r => (r + 1) % 3), []);

  const createPlaylist = useCallback((name) => {
    const p = { id: Date.now(), name, songs: [] };
    setPlaylists(prev => [...prev, p]);
    return p;
  }, []);

  const addToPlaylist = useCallback((playlistId, song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.songs.find(s => s.url === song.url)) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId, songUrl) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.url !== songUrl) };
      }
      return p;
    }));
  }, []);

  const deletePlaylist = useCallback((id) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <PlayerContext.Provider value={{
      songs, currentSong, currentIndex, isPlaying, currentTime, duration,
      shuffle, repeat, showNowPlaying, playlists, library,
      playSong, togglePlayPause, skipNext, skipPrev, seekTo,
      toggleShuffle, toggleRepeat, setShowNowPlaying,
      createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist,
      setSongs,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
