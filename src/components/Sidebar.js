import React from 'react';
import { NavLink } from 'react-router-dom';
import { IoMusicalNotes, IoLogoYoutube, IoList, IoHome } from 'react-icons/io5';
import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <IoMusicalNotes />
        <span>Tunebox</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <IoHome /> <span>My Music</span>
        </NavLink>
        <NavLink to="/youtube" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <IoLogoYoutube /> <span>YouTube</span>
        </NavLink>
        <NavLink to="/playlists" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <IoList /> <span>Playlists</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
