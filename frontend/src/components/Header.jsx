import React from 'react';
import { NAV_ITEMS } from '../data/constants';

export default function Header({ activeTab, isConnected }) {
  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || {
    label: 'Dashboard',
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-page-title">{currentNav.label}</h1>
      </div>

      <div className="header-right">
        <div className={`health-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="pulse-dot"></span>
          <span>{isConnected ? '● Backend Connected' : '● Backend Disconnected'}</span>
        </div>
      </div>
    </header>
  );
}
