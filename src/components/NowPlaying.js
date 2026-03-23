import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import {
  IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack,
  IoShuffle, IoRepeat, IoChevronDown, IoMusicalNotes
} from 'react-icons/io5';
import './NowPlaying.css';

function NowPlaying() {
  const {
    currentSong, isPlaying, currentTime, duration, shuffle, repeat,
    togglePlayPause, skipNext, skipPrev, seekTo,
    toggleShuffle, toggleRepeat, showNowPlaying, setShowNowPlaying
  } = usePlayer();

  if (!showNowPlaying || !currentSong) return null;

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const repeatLabels = ['off', 'all', 'one'];

  return (
    <div className="now-playing">
      <div className="np-header">
        <button className="np-collapse" onClick={() => setShowNowPlaying(false)}>
          <IoChevronDown />
        </button>
        <span className="np-label">Now Playing</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="np-art-container">
        {currentSong.cover ? (
          <img src={currentSong.cover} alt="" className="np-art" />
        ) : (
          <div className="np-art np-art-placeholder">
            <IoMusicalNotes />
          </div>
        )}
      </div>

      <div className="np-info">
        <div className="np-title">{currentSong.title}</div>
        <div className="np-artist">{currentSong.artist || 'Unknown'}</div>
      </div>

      <div className="np-seek">
        <input
          type="range" min="0" max={duration || 0} value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="np-seek-bar"
        />
        <div className="np-times">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="np-controls">
        <button className={`np-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
          <IoShuffle />
        </button>
        <button className="np-btn" onClick={skipPrev}>
          <IoPlaySkipBack />
        </button>
        <button className="np-play" onClick={togglePlayPause}>
          {isPlaying ? <IoPause /> : <IoPlay />}
        </button>
        <button className="np-btn" onClick={skipNext}>
          <IoPlaySkipForward />
        </button>
        <button className={`np-btn ${repeat > 0 ? 'active' : ''}`} onClick={toggleRepeat}>
          <IoRepeat />
          {repeat === 2 && <span className="repeat-badge">1</span>}
        </button>
      </div>
    </div>
  );
}

export default NowPlaying;
