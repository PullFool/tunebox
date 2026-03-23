import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sound.setCategory('Playback');

const PlayerContext = createContext<any>(null);
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({children}: {children: React.ReactNode}) {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);

  const soundRef = useRef<Sound | null>(null);
  const intervalRef = useRef<any>(null);

  const currentSong = currentIndex >= 0 && currentIndex < songs.length ? songs[currentIndex] : null;

  useEffect(() => {
    AsyncStorage.getItem('tunebox_playlists').then(data => {
      if (data) setPlaylists(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('tunebox_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startTracking = useCallback(() => {
    stopTracking();
    intervalRef.current = setInterval(() => {
      if (soundRef.current && soundRef.current.isLoaded()) {
        soundRef.current.getCurrentTime(sec => setCurrentTime(sec));
      }
    }, 500);
  }, [stopTracking]);

  const playSong = useCallback(async (songList: any[], index: number) => {
    setSongs(songList);
    setCurrentIndex(index);
    const song = songList[index];
    if (!song) return;

    // Stop previous
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
    }
    stopTracking();

    const sound = new Sound(song.url, '', (error) => {
      if (error) {
        console.error('Sound load error:', error);
        return;
      }
      setDuration(sound.getDuration());
      sound.play((success) => {
        if (success) {
          // Finished playing
          if (repeat === 2) {
            sound.setCurrentTime(0);
            sound.play();
          }
        }
      });
      setIsPlaying(true);
      startTracking();
    });
    soundRef.current = sound;

    setLibrary(prev => {
      if (prev.find(s => s.id === song.id)) return prev;
      return [...prev, song];
    });
  }, [repeat, startTracking, stopTracking]);

  const togglePlayPause = useCallback(() => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
    } else {
      soundRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const skipNext = useCallback(() => {
    if (songs.length === 0) return;
    let next;
    if (shuffle) {
      next = Math.floor(Math.random() * songs.length);
    } else {
      next = (currentIndex + 1) % songs.length;
      if (next === 0 && repeat === 0) return;
    }
    playSong(songs, next);
  }, [songs, currentIndex, shuffle, repeat, playSong]);

  const skipPrev = useCallback(() => {
    if (songs.length === 0) return;
    if (currentTime > 3 && soundRef.current) {
      soundRef.current.setCurrentTime(0);
      return;
    }
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    playSong(songs, prev);
  }, [songs, currentIndex, currentTime, playSong]);

  const seekTo = useCallback((time: number) => {
    if (soundRef.current) {
      soundRef.current.setCurrentTime(time);
    }
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeat(r => (r + 1) % 3), []);

  const createPlaylist = useCallback((name: string) => {
    const p = {id: Date.now(), name, songs: [] as any[]};
    setPlaylists(prev => [...prev, p]);
    return p;
  }, []);

  const addToPlaylist = useCallback((playlistId: number, song: any) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.songs.find((s: any) => s.url === song.url)) return p;
        return {...p, songs: [...p.songs, song]};
      }
      return p;
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: number, songUrl: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return {...p, songs: p.songs.filter((s: any) => s.url !== songUrl)};
      }
      return p;
    }));
  }, []);

  const deletePlaylist = useCallback((id: number) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <PlayerContext.Provider value={{
      songs, currentSong, currentIndex, isPlaying, currentTime, duration,
      shuffle, repeat, showNowPlaying, playlists, library,
      playSong, togglePlayPause, skipNext, skipPrev, seekTo,
      toggleShuffle, toggleRepeat, setShowNowPlaying,
      createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, setSongs,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
