import React, { useState, useEffect } from 'react';
import { getTelemetry } from '../services/simulationService';

export default function MonitoringPage() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTelemetry = async () => {
    try {
      const data = await getTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.warn('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();

    if (autoRefresh) {
      const interval = setInterval(fetchTelemetry, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const links = telemetry?.link_utilizations || [];

  return (
    <div className="monitoring-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Real-Time Network Telemetry & Performance Monitoring
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Live throughput, link utilization heatmaps, queue latency, and packet loss metrics across LAN, MAN, and WAN
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-Refresh (3s)
          </label>

          <button
            className="btn btn-secondary"
            onClick={fetchTelemetry}
            type="button"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* 6 Key Telemetry Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Network Throughput</span>
            <span className="stat-icon">⚡</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {loading ? '...' : `${telemetry?.current_throughput_mbps || 0} Mbps`}
          </div>
          <div className="stat-desc">Aggregated live transmission rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Packet Delivery Rate</span>
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {loading ? '...' : `${telemetry?.delivery_success_rate_percent || 100}%`}
          </div>
          <div className="stat-desc">
            {telemetry?.packets_delivered || 0} delivered / {telemetry?.packets_dropped || 0} dropped
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Average RTT Latency</span>
            <span className="stat-icon">⏱️</span>
          </div>
          <div className="stat-value">
            {loading ? '...' : `${telemetry?.avg_latency_ms || 0} ms`}
          </div>
          <div className="stat-desc">Mean round-trip time across subnets</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Link Ratio</span>
            <span className="stat-icon">🔌</span>
          </div>
          <div className="stat-value">
            {loading ? '...' : `${telemetry?.active_links || 0} / ${telemetry?.total_links || 0}`}
          </div>
          <div className="stat-desc">Physical & fiber links online</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Area Subnet Breakdown</span>
            <span className="stat-icon">🌐</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <span className="code-badge" style={{ color: '#38bdf8' }}>LAN: {telemetry?.lan_devices || 0}</span>
            <span className="code-badge" style={{ color: '#10b981' }}>MAN: {telemetry?.man_devices || 0}</span>
            <span className="code-badge" style={{ color: '#f59e0b' }}>WAN: {telemetry?.wan_devices || 0}</span>
          </div>
          <div className="stat-desc">Node distribution across campus tiers</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Simulated Packets</span>
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-value">
            {loading ? '...' : telemetry?.total_packets_simulated || 0}
          </div>
          <div className="stat-desc">Cumulative packets processed</div>
        </div>
      </div>

      {/* Link Utilization Matrix & Heatmap */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Interconnect Link Utilization & Load Heatmap</h3>
          <span className="code-badge">{links.length} Links Monitored</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Link ID</th>
                <th>Endpoints (Source &harr; Target)</th>
                <th>Capacity</th>
                <th>Propagation Latency</th>
                <th>Load Utilization</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {links.map((lk) => {
                const isDown = lk.status === 'DOWN';
                const util = lk.utilization_percent;
                const barColor = util > 80 ? 'var(--accent-rose)' : util > 50 ? 'var(--accent-amber)' : 'var(--accent-cyan)';

                return (
                  <tr key={lk.link_id}>
                    <td>
                      <span className="code-badge">{lk.link_id}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {lk.source_id} &harr; {lk.target_id}
                      </strong>
                    </td>
                    <td>{lk.bandwidth_mbps} Mbps</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{lk.latency_ms} ms</td>
                    <td style={{ minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${isDown ? 0 : util}%`,
                              background: barColor,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', minWidth: '42px', color: barColor }}>
                          {isDown ? '0.0%' : `${util}%`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isDown ? 'inactive' : 'active'}`}>
                        ● {lk.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
