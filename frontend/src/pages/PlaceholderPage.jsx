import React from 'react';
import { NAV_ITEMS } from '../data/constants';

export default function PlaceholderPage({ activeTab }) {
  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || {
    label: 'Module',
    icon: '⚡',
  };

  return (
    <div className="placeholder-container">
      <div className="placeholder-card">
        <div className="placeholder-icon">{currentNav.icon}</div>
        <h2 className="placeholder-title">{currentNav.label}</h2>
        <div className="placeholder-message">
          Coming in a future simulation phase.
        </div>
        <p className="placeholder-note">
          This subsystem is intentionally stubbed in Phase 1 (Foundation). 
          The backend and service layer architecture have been structured to support this feature in upcoming phases.
        </p>
      </div>
    </div>
  );
}
