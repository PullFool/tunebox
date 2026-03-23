import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import TrackPlayer, {
  Capability,
  State,
  usePlaybackState,
  useProgress,
  Event,
} from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlayerContext = createContext<any>(null);
export const usePlayer = () => useContext(PlayerContext);

let isSetup = false;

async function setupPlayer() {
  if (isSetup) return;
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
    });
    isSetup = true;
  } catch (e) {
    console.log('Player setup error:', e);
  }
}

export function PlayerProvider({children}: {children: React.ReactNode}) {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentSong =
    currentIndex >= 0 && currentIndex < songs.length
      ? songs[currentIndex]
      : null;

  // Setup
  useEffect(() => {
    setupPlayer();
    AsyncStorage.getItem('tunebox_playlists').then(data => {
      if (data) setPlaylists(JSON.parse(data));
    });
  }, []);

  // Save playlists
  useEffect(() => {
    AsyncStorage.setItem('tunebox_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Track progress polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const pos = await TrackPlayer.getPosition();
        const dur = await TrackPlayer.getDuration();
        const state = await TrackPlayer.getState();
        setCurrentTime(pos);
        setDuration(dur);
        setIsPlaying(state === State.Playing);
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const playSong = useCallback(
    async (songList: any[], index: number) => {
      setSongs(songList);
      setCurrentIndex(index);
      const song = songList[index];
      if (!song) return;

      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: song.id,
          url: song.url,
          title: song.title,
          artist: song.artist || 'Unknown',
          artwork: song.cover || undefined,
        });
        await TrackPlayer.play();

        setLibrary(prev => {
          if (prev.find(s => s.id === song.id)) return prev;
          return [...prev, song];
        });
      } catch (e) {
        console.error('Play error:', e);
      }
    },
    [],
  );

  const togglePlayPause = useCallback(async () => {
    const state = await TrackPlayer.getState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, []);

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
    if (currentTime > 3) {
      await TrackPlayer.seekTo(0);
      return;
    }
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    await playSong(songs, prev);
  }, [songs, currentIndex, currentTime, playSong]);

  const seekTo = useCallback(async (time: number) => {
    await TrackPlayer.seekTo(time);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeat(r => (r + 1) % 3), []);

  const createPlaylist = useCallback((name: string) => {
    const p = {id: Date.now(), name, songs: []};
    setPlaylists(prev => [...prev, p]);
    return p;
  }, []);

  const addToPlaylist = useCallback((playlistId: number, song: any) => {
    setPlaylists(prev =>
      prev.map(p => {
        if (p.id === playlistId) {
          if (p.songs.find((s: any) => s.url === song.url)) return p;
          return {...p, songs: [...p.songs, song]};
        }
        return p;
      }),
    );
  }, []);

  const removeFromPlaylist = useCallback(
    (playlistId: number, songUrl: string) => {
      setPlaylists(prev =>
        prev.map(p => {
          if (p.id === playlistId) {
            return {...p, songs: p.songs.filter((s: any) => s.url !== songUrl)};
          }
          return p;
        }),
      );
    },
    [],
  );

  const deletePlaylist = useCallback((id: number) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        songs,
        currentSong,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        shuffle,
        repeat,
        showNowPlaying,
        playlists,
        library,
        playSong,
        togglePlayPause,
        skipNext,
        skipPrev,
        seekTo,
        toggleShuffle,
        toggleRepeat,
        setShowNowPlaying,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        setSongs,
      }}>
      {children}
    </PlayerContext.Provider>
  );
}
