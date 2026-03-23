import React from 'react';
import { NavLink } from 'react-router-dom';
import { IoHome, IoLogoYoutube, IoList } from 'react-icons/io5';
import './BottomNav.css';

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <IoHome />
        <span>Music</span>
      </NavLink>
      <NavLink to="/youtube" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <IoLogoYoutube />
        <span>YouTube</span>
      </NavLink>
      <NavLink to="/playlists" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <IoList />
        <span>Playlists</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
