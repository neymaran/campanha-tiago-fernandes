import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

/**
 * Main application layout component.
 * Provides a fixed top navigation bar with a centered, responsive content area.
 * Supports both direct children nesting and React Router v6 Outlet rendering.
 */
const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="app-layout">
      {/* Top Fixed Navigation Bar */}
      <Navbar user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="main-content" id="main-content" tabIndex="-1">
        <div className="layout-container">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default Layout;
