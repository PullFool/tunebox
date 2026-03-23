import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const PlayerContext = createContext();

export function usePlayer() {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0); // 0=off, 1=all, 2=one
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('tunebox_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [library, setLibrary] = useState([]);

  const audioRef = useRef(new Audio());

  const currentSong = currentIndex >= 0 ? songs[currentIndex] : null;

  // Save playlists to localStorage
  useEffect(() => {
    localStorage.setItem('tunebox_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeat === 2) {
        audio.currentTime = 0;
        audio.play();
      } else {
        skipNext();
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [repeat]);

  const addToLibrary = useCallback((song) => {
    setLibrary(prev => {
      if (prev.find(s => s.id === song.id)) return prev;
      return [...prev, song];
    });
  }, []);

  const playSong = useCallback((songList, index) => {
    setSongs(songList);
    setCurrentIndex(index);
    const song = songList[index];
    if (song) {
      audioRef.current.src = song.url;
      audioRef.current.play().catch(() => {});
      addToLibrary(song);
    }
  }, [addToLibrary]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isPlaying]);

  const skipNext = useCallback(() => {
    if (songs.length === 0) return;
    let next;
    if (shuffle) {
      next = Math.floor(Math.random() * songs.length);
    } else {
      next = (currentIndex + 1) % songs.length;
      if (next === 0 && repeat === 0) {
        audioRef.current.pause();
        return;
      }
    }
    setCurrentIndex(next);
    audioRef.current.src = songs[next].url;
    audioRef.current.play().catch(() => {});
  }, [songs, currentIndex, shuffle, repeat]);

  const skipPrev = useCallback(() => {
    if (songs.length === 0) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prev);
    audioRef.current.src = songs[prev].url;
    audioRef.current.play().catch(() => {});
  }, [songs, currentIndex]);

  const seekTo = useCallback((time) => {
    audioRef.current.currentTime = time;
  }, []);

  const setVolumeLevel = useCallback((v) => {
    setVolume(v);
    audioRef.current.volume = v;
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeat(r => (r + 1) % 3), []);

  // Playlist management
  const createPlaylist = useCallback((name) => {
    const newPlaylist = { id: Date.now(), name, songs: [] };
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
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

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  }, []);

  const value = {
    songs, currentSong, currentIndex, isPlaying, currentTime, duration,
    volume, shuffle, repeat, showNowPlaying, playlists, downloadProgress, library,
    playSong, togglePlayPause, skipNext, skipPrev, seekTo,
    setVolumeLevel, toggleShuffle, toggleRepeat,
    setShowNowPlaying, createPlaylist, addToPlaylist, removeFromPlaylist,
    deletePlaylist, setDownloadProgress, setSongs, addToLibrary,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}
