import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { searchYouTube, getAudioStream } from '../api/youtube';
import { IoSearch, IoDownload, IoMusicalNotes, IoPlay, IoClose, IoPause } from 'react-icons/io5';

function YouTube() {
  const { playSong, currentSong, isPlaying, downloadProgress, setDownloadProgress } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [streamedSongs, setStreamedSongs] = useState([]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const data = await searchYouTube(query);
      setResults(data);
      if (data.length === 0) setError('No results found');
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const playFromYouTube = async (video) => {
    setDownloadProgress({ title: video.title, percent: 0, status: 'Getting audio stream...' });
    try {
      const stream = await getAudioStream(video.id);
      if (stream) {
        const song = {
          id: `yt-${video.id}`,
          title: stream.title || video.title,
          artist: stream.author || video.channel,
          url: stream.url,
          cover: video.thumbnail,
          source: 'youtube-stream',
        };
        setStreamedSongs(prev => {
          const exists = prev.find(s => s.id === song.id);
          if (exists) return prev;
          return [song, ...prev];
        });
        // Play the song
        const allSongs = [song, ...streamedSongs.filter(s => s.id !== song.id)];
        playSong(allSongs, 0);
      } else {
        setError('Could not get audio stream. Try the YouTube player instead.');
      }
    } catch (e) {
      setError('Stream failed: ' + e.message);
    } finally {
      setDownloadProgress(null);
    }
  };

  const toggleVideoPlayer = (videoId) => {
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
    } else {
      setPlayingVideoId(videoId);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">YouTube</h1>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search for music..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={search}
          disabled={searching}
          className="btn btn-primary"
          style={{ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IoSearch /> {searching ? '...' : 'Search'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', padding: '8px 0', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {downloadProgress && (
        <div className="download-toast">
          <div className="title">{downloadProgress.title}</div>
          <div className="status">{downloadProgress.status || 'Loading...'}</div>
        </div>
      )}

      {/* YouTube Embedded Player */}
      {playingVideoId && (
        <div style={{
          position: 'relative', marginBottom: 20, borderRadius: 12,
          overflow: 'hidden', background: '#000',
        }}>
          <button
            onClick={() => setPlayingVideoId(null)}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 10,
              background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >
            <IoClose />
          </button>
          <iframe
            width="100%"
            height="220"
            src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1&rel=0`}
            title="YouTube player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>Search Results</h2>
          <ul className="song-list" style={{ marginBottom: 32 }}>
            {results.map((video, i) => (
              <li key={video.id || i} className="song-item" style={{ gap: 10 }}>
                {/* Thumbnail - click to play video */}
                <div
                  onClick={() => toggleVideoPlayer(video.id)}
                  style={{
                    width: 48, height: 48, borderRadius: 6, flexShrink: 0,
                    overflow: 'hidden', position: 'relative', cursor: 'pointer',
                  }}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IoMusicalNotes style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: playingVideoId === video.id ? 'rgba(29,185,84,0.7)' : 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {playingVideoId === video.id ? (
                      <IoPause style={{ color: '#fff', fontSize: 20 }} />
                    ) : (
                      <IoPlay style={{ color: '#fff', fontSize: 20 }} />
                    )}
                  </div>
                </div>

                {/* Info - click to stream audio */}
                <div
                  className="song-item-info"
                  onClick={() => playFromYouTube(video)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="song-item-title">{video.title}</div>
                  <div className="song-item-artist">{video.channel} • {video.duration}</div>
                </div>

                {/* Stream as audio button */}
                <button
                  onClick={() => playFromYouTube(video)}
                  style={{
                    background: 'var(--green)', color: '#000', border: 'none',
                    borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  <IoPlay /> Play
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Recently Streamed */}
      {streamedSongs.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>Recently Played</h2>
          <ul className="song-list">
            {streamedSongs.map((song, index) => (
              <li
                key={song.id}
                className={`song-item ${currentSong?.url === song.url ? 'active' : ''}`}
                onClick={() => playSong(streamedSongs, index)}
              >
                <span className="song-item-number">
                  {currentSong?.url === song.url && isPlaying ? (
                    <IoPlay style={{ color: 'var(--green)' }} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="song-item-art">
                  {song.cover ? <img src={song.cover} alt="" /> : <IoMusicalNotes className="icon" />}
                </div>
                <div className="song-item-info">
                  <div className="song-item-title">{song.title}</div>
                  <div className="song-item-artist">{song.artist}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {results.length === 0 && streamedSongs.length === 0 && !searching && (
        <div className="empty-state">
          <IoSearch className="icon" />
          <h3>Search YouTube</h3>
          <p>Find and play music directly</p>
        </div>
      )}
    </div>
  );
}

export default YouTube;
