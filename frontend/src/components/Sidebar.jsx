import React from 'react';
import { NAV_ITEMS } from '../data/constants';

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">🌐</div>
        <div className="sidebar-brand">
          <span className="sidebar-title">Campus NetSim</span>
          <span className="sidebar-subtitle">LAN • MAN • WAN</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>Phase 1 Foundation</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
          v1.0.0-dev
        </div>
      </div>
    </aside>
  );
}
