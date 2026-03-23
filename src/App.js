import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Player from './components/Player';
import NowPlaying from './components/NowPlaying';
import LocalMusic from './pages/LocalMusic';
import YouTube from './pages/YouTube';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import './App.css';

function App() {
  return (
    <PlayerProvider>
      <Router>
        <div className="app">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LocalMusic />} />
              <Route path="/youtube" element={<YouTube />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlist/:id" element={<PlaylistDetail />} />
            </Routes>
          </main>
          <Player />
          <NowPlaying />
          <BottomNav />
        </div>
      </Router>
    </PlayerProvider>
  );
}

export default App;
