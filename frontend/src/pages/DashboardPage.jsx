import React, { useEffect, useState } from 'react';
import { getDevices } from '../services/deviceService';
import { getTelemetry, getPacketHistory, getPresets, loadPreset } from '../services/simulationService';
import PacketInspectorModal from '../components/PacketInspectorModal';

export default function DashboardPage({ isConnected, onNavigate }) {
  const [devices, setDevices] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [recentPackets, setRecentPackets] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [loadingPresetId, setLoadingPresetId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [devList, telData, pkts, presetList] = await Promise.all([
        getDevices(),
        getTelemetry(),
        getPacketHistory(5),
        getPresets().catch(() => [])
      ]);
      setDevices(devList || []);
      setTelemetry(telData);
      setRecentPackets(pkts || []);
      if (presetList && presetList.length > 0) {
        setPresets(presetList);
      }
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isConnected]);

  const handleQuickLoadPreset = async (presetId) => {
    try {
      setLoadingPresetId(presetId);
      await loadPreset(presetId);
      await fetchDashboardData();
    } catch (err) {
      alert(`Failed to load structure: ${err.message}`);
    } finally {
      setLoadingPresetId(null);
    }
  };

  // Derived metrics
  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.status === 'active').length;
  const activeLinks = telemetry?.active_links || 0;
  const totalLinks = telemetry?.total_links || 0;
  const packetsSent = telemetry?.total_packets_simulated || recentPackets.length;
  const packetsDelivered = telemetry?.packets_delivered || recentPackets.filter((p) => p.status === 'SUCCESS' || p.delivered).length;
  const successRate = telemetry?.delivery_success_rate_percent || (recentPackets.length > 0 ? ((packetsDelivered / recentPackets.length) * 100).toFixed(0) : 100);
  const throughput = telemetry?.total_capacity_gbps ? `${telemetry.total_capacity_gbps} Gbps` : `${activeLinks * 1000} Mbps`;

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
            <span className="stat-label">Throughput Capacity</span>
            <span className="stat-icon">⚡</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {loading ? '...' : throughput}
          </div>
          <div className="stat-desc">Aggregated backbone capacity</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Packets Processed</span>
            <span className="stat-icon">📤</span>
          </div>
          <div className="stat-value">{packetsSent}</div>
          <div className="stat-desc">L2-L7 simulated packet transmissions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Delivery Health</span>
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-value" style={{ color: Number(successRate) >= 90 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {successRate}%
          </div>
          <div className="stat-desc">{packetsDelivered} delivered without packet drop</div>
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

      {/* Sample Topology Structures Carousel / Cards */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-cyan)' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">📁 Sample Network Topology Structures & Architectures</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Load production-grade pre-configured topologies with 1 click to test connectivity, failover, and packet simulation
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('topology')}
            type="button"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            🗺️ Open Canvas &rarr;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
          {(presets.length > 0 ? presets : [
            { id: 'enterprise-campus', name: 'Enterprise 3-Tier Campus', badge: '3-Tier Multi-Area', description: '12-node complete hierarchy across LAN 1, LAN 2, MAN Core Ring, Data Center, and WAN Edge.' },
            { id: 'star-lan', name: 'Department Star LAN', badge: 'Single Subnet Star', description: 'Central Gigabit Access Switch connecting 4 Workstations, Department Storage Server, and Gateway.' },
            { id: 'redundant-ring', name: 'Redundant MAN Mesh Ring', badge: 'Fault-Tolerant Ring', description: '4 Core Routers in dual-ring mesh with redundant cross-links for cable cut & failover testing.' },
            { id: 'hybrid-cloud-wan', name: 'Multi-Branch & Hybrid WAN', badge: 'Multi-Site WAN', description: 'Main Campus & Medical Branch connected through ISP WAN Cloud to AWS VPC cloud servers.' },
          ]).map((preset) => (
            <div
              key={preset.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{preset.name}</strong>
                  <span className="code-badge" style={{ fontSize: '0.68rem' }}>{preset.badge || 'Structure'}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.35', marginBottom: '0.75rem' }}>
                  {preset.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', flex: 1 }}
                  onClick={() => handleQuickLoadPreset(preset.id)}
                  disabled={loadingPresetId === preset.id}
                >
                  {loadingPresetId === preset.id ? 'Loading...' : '⚡ Load Structure'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={async () => {
                    await handleQuickLoadPreset(preset.id);
                    onNavigate('topology');
                  }}
                >
                  Load & View 🗺️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="status-panel-grid">
        {/* Campus Network Status Panel */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Campus Network Engine Status</h2>
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
              <span className="status-item-label">Packet Simulation Engine</span>
              <span className="status-item-val" style={{ color: 'var(--accent-cyan)' }}>
                ● Online (L2-L7 Dissection & Real-time Delay Model)
              </span>
            </div>

            <div className="status-item">
              <span className="status-item-label">Network Area Tiers</span>
              <span className="status-item-val" style={{ color: 'var(--accent-emerald)' }}>
                ● LAN (Access) / MAN (Core) / WAN (Edge Cloud)
              </span>
            </div>

            <div className="status-item">
              <span className="status-item-label">Deployment Backend</span>
              <span
                className="status-item-val"
                style={{
                  color: isConnected ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                }}
              >
                {isConnected ? '● Connected (FastAPI Server)' : '● In-Browser Simulation Engine (Active)'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launchpad Action Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions & Tools</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('packet-simulator')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              🚀 Launch Packet Simulator & Tracer
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
              onClick={() => onNavigate('devices')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              🖥️ Manage Network Devices & Hosts
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('simulation')}
              type="button"
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              ⚡ Run Fault Scenarios & Chaos Benchmarks
            </button>
          </div>
        </div>
      </div>

      {/* Recent Packet Stream */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
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
            No packets simulated yet. Click "Launch Packet Simulator" to transmit test packets.
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
                  <tr key={pkt.packet_id || pkt.id}>
                    <td><span className="code-badge">{pkt.packet_id || pkt.id}</span></td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{pkt.source_name}</strong> ({pkt.source_ip})</td>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{pkt.destination_name}</strong> ({pkt.destination_ip})</td>
                    <td><span className="code-badge" style={{ color: 'var(--accent-cyan)' }}>{pkt.protocol}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>{pkt.total_latency_ms} ms</td>
                    <td>{pkt.hops?.length || 0}</td>
                    <td>
                      <span className={`status-badge ${pkt.status === 'DELIVERED' || pkt.status === 'SUCCESS' ? 'active' : 'inactive'}`}>
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
