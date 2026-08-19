import React, { useState, useEffect } from 'react';
import { getDevices } from '../services/deviceService';
import { sendPacket, getPacketHistory, clearPacketHistory } from '../services/simulationService';
import { PROTOCOL_TYPES } from '../data/constants';
import PacketInspectorModal from '../components/PacketInspectorModal';

export default function PacketSimulatorPage() {
  const [devices, setDevices] = useState([]);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [protocol, setProtocol] = useState('ICMP');
  const [sizeBytes, setSizeBytes] = useState(64);
  const [ttl, setTtl] = useState(64);
  const [payload, setPayload] = useState('Campus Network Packet Payload');

  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [activeHopStep, setActiveHopStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [history, setHistory] = useState([]);
  const [selectedInspectorPacket, setSelectedInspectorPacket] = useState(null);

  const loadData = async () => {
    try {
      const [devs, hist] = await Promise.all([getDevices(), getPacketHistory(30)]);
      setDevices(devs || []);
      setHistory(hist || []);

      if (devs && devs.length >= 2) {
        if (!sourceId) setSourceId(devs[0].id);
        if (!destinationId) setDestinationId(devs[devs.length - 1].id);
      }
    } catch (err) {
      console.warn('Error loading simulation data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendPacket = async () => {
    if (!sourceId || !destinationId) {
      alert('Please select both source and destination nodes.');
      return;
    }
    if (sourceId === destinationId) {
      alert('Source and destination cannot be the same node.');
      return;
    }

    try {
      setIsSending(true);
      const res = await sendPacket({
        source_id: sourceId,
        destination_id: destinationId,
        protocol: protocol,
        size_bytes: parseInt(sizeBytes) || 64,
        ttl: parseInt(ttl) || 64,
        payload: payload,
      });

      setCurrentSimulation(res);
      setActiveHopStep(0);
      setIsAutoPlaying(true);

      // Refresh history
      const hist = await getPacketHistory(30);
      setHistory(hist || []);
    } catch (err) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-play animation through hops
  useEffect(() => {
    if (!isAutoPlaying || !currentSimulation || !currentSimulation.hops) return;

    const totalHops = currentSimulation.hops.length;
    if (activeHopStep < totalHops) {
      const timer = setTimeout(() => {
        setActiveHopStep((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsAutoPlaying(false);
    }
  }, [isAutoPlaying, activeHopStep, currentSimulation]);

  const handleClearHistory = async () => {
    try {
      await clearPacketHistory();
      setHistory([]);
    } catch (err) {
      alert(`Failed to clear history: ${err.message}`);
    }
  };

  const srcDev = devices.find((d) => d.id === sourceId);
  const dstDev = devices.find((d) => d.id === destinationId);
  const hops = currentSimulation?.hops || [];

  return (
    <div className="packet-simulator-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Packet Generator & Transmission Simulator
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Simulate multi-hop packet encapsulation, queuing delay, TTL countdown, and deep protocol dissection across LAN/MAN/WAN
          </p>
        </div>
      </div>

      {/* Main Grid: Control Panel + Live Visualizer */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Generator Controls Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Packet Parameters</h3>
            <span className="code-badge">{protocol}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Source Node (Origin)</label>
              <select
                className="form-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address}) [{d.area}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Destination Node (Target)</label>
              <select
                className="form-select"
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address}) [{d.area}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Protocol</label>
              <select
                className="form-select"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
              >
                {PROTOCOL_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Size (Bytes)</label>
                <input
                  type="number"
                  className="form-input mono"
                  value={sizeBytes}
                  onChange={(e) => setSizeBytes(e.target.value)}
                  min={20}
                  max={1500}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Initial TTL</label>
                <input
                  type="number"
                  className="form-input mono"
                  value={ttl}
                  onChange={(e) => setTtl(e.target.value)}
                  min={1}
                  max={255}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Application Payload</label>
              <input
                type="text"
                className="form-input"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSendPacket}
              disabled={isSending || isAutoPlaying}
              style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}
              type="button"
            >
              {isSending ? '⏳ Routing & Transmitting...' : '🚀 Transmit Packet'}
            </button>
          </div>
        </div>

        {/* Live Packet Transmission Visualizer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Live Hop-by-Hop Transmission Visualizer</h3>
            {currentSimulation && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`status-badge ${currentSimulation.status === 'SUCCESS' ? 'active' : 'inactive'}`}>
                  ● {currentSimulation.status}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedInspectorPacket(currentSimulation)}
                  type="button"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  🔍 Inspect L2-L7 Headers
                </button>
              </div>
            )}
          </div>

          {!currentSimulation ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="empty-state-icon">📦</div>
              <h4 className="empty-state-title">Ready for Transmission</h4>
              <p className="empty-state-desc">
                Select your source and destination nodes on the left, then click "Transmit Packet" to watch the packet hop across switches, core routers, and WAN uplinks in real-time.
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Route Summary Banner */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {currentSimulation.source_name} ({currentSimulation.source_ip}) &rarr; {currentSimulation.destination_name} ({currentSimulation.destination_ip})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {currentSimulation.details}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                    {currentSimulation.total_latency_ms} ms
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {hops.length} Hops Traversed
                  </div>
                </div>
              </div>

              {/* Hop Step Animation Track */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {hops.map((hop, idx) => {
                  const isVisible = idx <= activeHopStep;
                  const isCurrent = idx === activeHopStep && isAutoPlaying;

                  return (
                    <div
                      key={hop.hop_number}
                      style={{
                        background: isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                        border: isCurrent ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isVisible ? 1 : 0.25,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isVisible ? 'var(--accent-cyan)' : 'var(--bg-input)',
                            color: isVisible ? '#000' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                          }}
                        >
                          {hop.hop_number}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {hop.from_device_name} &rarr; {hop.to_device_name}
                            </strong>
                            <span className={`status-badge ${hop.action === 'DROPPED' ? 'inactive' : 'active'}`} style={{ fontSize: '0.7rem' }}>
                              {hop.action}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {hop.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        <div style={{ color: 'var(--accent-cyan)' }}>+{hop.link_latency_ms} ms</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>TTL: {hop.ttl_remaining}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stepper Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Step {Math.min(activeHopStep + 1, hops.length)} of {hops.length}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveHopStep((prev) => Math.max(0, prev - 1))}
                    disabled={activeHopStep <= 0}
                    type="button"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    ⏮ Previous Hop
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveHopStep((prev) => Math.min(hops.length - 1, prev + 1))}
                    disabled={activeHopStep >= hops.length - 1}
                    type="button"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Next Hop ⏭
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setActiveHopStep(0); setIsAutoPlaying(true); }}
                    type="button"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    ▶ Replay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Packet Transmission History */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 className="card-title">Recent Packet Transmission Log</h3>
            <span className="code-badge">{history.length} Entries</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleClearHistory}
            disabled={history.length === 0}
            type="button"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            🗑️ Clear History
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No packets simulated yet. Use the generator above to transmit packets.
          </div>
        ) : (
          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time / ID</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Size</th>
                  <th>Latency</th>
                  <th>Hops</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((pkt) => (
                  <tr key={pkt.id}>
                    <td>
                      <span className="code-badge">{pkt.id}</span>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {pkt.timestamp}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{pkt.source_name}</strong>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {pkt.source_ip}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{pkt.destination_name}</strong>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {pkt.destination_ip}
                      </div>
                    </td>
                    <td>
                      <span className="code-badge" style={{ color: 'var(--accent-cyan)' }}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td>{pkt.size_bytes} B</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                      {pkt.total_latency_ms} ms
                    </td>
                    <td>{pkt.hops?.length || 0}</td>
                    <td>
                      <span className={`status-badge ${pkt.status === 'SUCCESS' ? 'active' : 'inactive'}`}>
                        ● {pkt.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedInspectorPacket(pkt)}
                        type="button"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                      >
                        Inspect Headers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep Packet Dissector Modal */}
      <PacketInspectorModal
        isOpen={!!selectedInspectorPacket}
        onClose={() => setSelectedInspectorPacket(null)}
        packet={selectedInspectorPacket}
      />
    </div>
  );
}
