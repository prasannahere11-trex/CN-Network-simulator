import React, { useEffect, useState } from 'react';
import { getDevices } from '../services/deviceService';
import { getTelemetry, getPacketHistory } from '../services/simulationService';
import PacketInspectorModal from '../components/PacketInspectorModal';

export default function DashboardPage({ isConnected, onNavigate }) {
  const [devices, setDevices] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [recentPackets, setRecentPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacket, setSelectedPacket] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [devList, telData, pkts] = await Promise.all([
        getDevices(),
        getTelemetry(),
        getPacketHistory(5),
      ]);
      setDevices(devList || []);
      setTelemetry(telData);
      setRecentPackets(pkts || []);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isConnected]);

  // Derived metrics
  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.status === 'active').length;
  const activeLinks = telemetry?.active_links || 0;
  const totalLinks = telemetry?.total_links || 0;
  const packetsSent = telemetry?.total_packets_simulated || 0;
  const packetsDelivered = telemetry?.packets_delivered || 0;
  const successRate = telemetry?.delivery_success_rate_percent || 100.0;
  const throughput = telemetry?.current_throughput_mbps || 0;

  return (
    <div className="dashboard-container">
      {/* 6 Metric Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Devices</span>
            <span className="stat-icon">🖥️</span>
          </div>
          <div className="stat-value">{loading ? '...' : totalDevices}</div>
          <div className="stat-desc">
            {activeDevices} Active / {totalDevices - activeDevices} Standby
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Links Online</span>
            <span className="stat-icon">🔌</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {loading ? '...' : `${activeLinks} / ${totalLinks}`}
          </div>
          <div className="stat-desc">LAN, MAN Fiber & WAN Interconnects</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Throughput</span>
            <span className="stat-icon">⚡</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {loading ? '...' : `${throughput} Mbps`}
          </div>
          <div className="stat-desc">Live aggregated bandwidth</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Packets Transmitted</span>
            <span className="stat-icon">📤</span>
          </div>
          <div className="stat-value">{packetsSent}</div>
          <div className="stat-desc">Simulated network packets</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Delivery Success</span>
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-value" style={{ color: successRate >= 90 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {successRate}%
          </div>
          <div className="stat-desc">{packetsDelivered} delivered successfully</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Campus Tiers</span>
            <span className="stat-icon">🌐</span>
          </div>
          <div className="stat-value">3 Areas</div>
          <div className="stat-desc">LAN (Depts), MAN (Core), WAN (Edge)</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="status-panel-grid">
        {/* Campus Network Status Panel */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Campus Network Architecture & Health</h2>
            <button
              className="btn btn-secondary"
              onClick={fetchDashboardData}
              type="button"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              🔄 Refresh
            </button>
          </div>

          <div className="status-list">
            <div className="status-item">
              <span className="status-item-label">Network Routing Engine</span>
              <span className="status-item-val" style={{ color: 'var(--accent-emerald)' }}>
                ● OSPF (Dijkstra SPF) & RIP Active
              </span>
            </div>

            <div className="status-item">
              <span className="status-item-label">Simulation Engine</span>
              <span className="status-item-val" style={{ color: 'var(--accent-cyan)' }}>
                ● Online (L2-L7 Dissection & Delay Model)
              </span>
            </div>

            <div className="status-item">
              <span className="status-item-label">Backend Connection</span>
              <span
                className="status-item-val"
                style={{
                  color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                }}
              >
                {isConnected ? '● Connected (FastAPI)' : '● Disconnected'}
              </span>
            </div>
          </div>

          {/* Area Distribution Overview */}
          <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '700' }}>LAN TIER</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{telemetry?.lan_devices || 0} Nodes</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CSE & ECE Dept Labs</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>MAN BACKBONE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{telemetry?.man_devices || 0} Nodes</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>10G Core Ring Routers</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '700' }}>WAN EDGE & CLOUD</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{telemetry?.wan_devices || 0} Nodes</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Border Gateway / ISP</div>
            </div>
          </div>
        </div>

        {/* Quick Navigation / Actions Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Action Hub</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('packet-simulator')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              📦 Launch Packet Simulator
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('topology')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              🗺️ Open Topology Canvas ({devices.length} Nodes)
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('routing')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              🔀 Inspect Routing Tables (OSPF/RIP)
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('simulation')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              ⚡ Run Fault Scenarios & Benchmarks
            </button>
          </div>
        </div>
      </div>

      {/* Recent Packet Stream */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Network Activity Stream</h3>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('packet-simulator')}
            type="button"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            View All Logs &rarr;
          </button>
        </div>

        {recentPackets.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No packets simulated yet. Click "Launch Packet Simulator" to transmit packets.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Packet ID</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Latency</th>
                  <th>Hops</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {recentPackets.map((pkt) => (
                  <tr key={pkt.id}>
                    <td><span className="code-badge">{pkt.id}</span></td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{pkt.source_name}</strong> ({pkt.source_ip})</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{pkt.destination_name}</strong> ({pkt.destination_ip})</td>
                    <td><span className="code-badge" style={{ color: 'var(--accent-cyan)' }}>{pkt.protocol}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>{pkt.total_latency_ms} ms</td>
                    <td>{pkt.hops?.length || 0}</td>
                    <td>
                      <span className={`status-badge ${pkt.status === 'SUCCESS' ? 'active' : 'inactive'}`}>
                        ● {pkt.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedPacket(pkt)}
                        type="button"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PacketInspectorModal
        isOpen={!!selectedPacket}
        onClose={() => setSelectedPacket(null)}
        packet={selectedPacket}
      />
    </div>
  );
}
