import React, { useState } from 'react';
import { sendPacket } from '../services/simulationService';
import PacketInspectorModal from './PacketInspectorModal';

export default function PingModal({ isOpen, onClose, sourceDevice, devices = [] }) {
  const [targetId, setTargetId] = useState('');
  const [pingCount, setPingCount] = useState(4);
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState(null);

  if (!isOpen || !sourceDevice) return null;

  const validTargets = devices.filter((d) => d.id !== sourceDevice.id);
  const currentTarget = targetId || (validTargets[0] ? validTargets[0].id : '');

  const handleRunPing = async () => {
    if (!currentTarget) return;
    setIsRunning(true);
    setResults([]);

    const runLogs = [];
    for (let i = 1; i <= pingCount; i++) {
      try {
        const res = await sendPacket({
          source_id: sourceDevice.id,
          destination_id: currentTarget,
          protocol: 'ICMP',
          size_bytes: 64,
          ttl: 64,
          payload: `ICMP Echo Seq=${i}`,
        });
        runLogs.push(res);
        setResults([...runLogs]);
      } catch (err) {
        runLogs.push({
          id: `ERR-${i}`,
          status: 'ERROR',
          total_latency_ms: 0,
          details: err.message,
        });
        setResults([...runLogs]);
      }
      // Small pause between pings
      if (i < pingCount) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    setIsRunning(false);
  };

  const targetDev = devices.find((d) => d.id === currentTarget);
  const successCount = results.filter((r) => r.status === 'SUCCESS').length;
  const lossPct = results.length > 0 ? Math.round(((results.length - successCount) / results.length) * 100) : 0;
  const avgRtt = successCount > 0 ? (results.filter(r => r.status === 'SUCCESS').reduce((acc, r) => acc + r.total_latency_ms, 0) / successCount).toFixed(2) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">ICMP Ping Diagnostic Utility</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Source: <strong style={{ color: 'var(--text-primary)' }}>{sourceDevice.name}</strong> ({sourceDevice.ip_address})
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Destination Node *</label>
              <select
                className="form-select"
                value={currentTarget}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={isRunning}
              >
                {validTargets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address}) [{d.area}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Echo Count</label>
              <select
                className="form-select"
                value={pingCount}
                onChange={(e) => setPingCount(parseInt(e.target.value))}
                disabled={isRunning}
              >
                <option value={2}>2 Packets</option>
                <option value={4}>4 Packets</option>
                <option value={8}>8 Packets</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRunPing}
            disabled={isRunning || !currentTarget}
            style={{ width: '100%', marginBottom: '1.25rem' }}
            type="button"
          >
            {isRunning ? '⏳ Sending ICMP Echo Requests...' : `▶ Ping ${targetDev ? targetDev.ip_address : ''}`}
          </button>

          {/* Terminal Output */}
          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              minHeight: '160px',
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              PING {targetDev?.ip_address} ({targetDev?.name}) 56(84) bytes of data.
            </div>

            {results.map((r, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                  color: r.status === 'SUCCESS' ? 'var(--badge-active-text)' : 'var(--badge-inactive-text)',
                  cursor: r.hops ? 'pointer' : 'default',
                }}
                onClick={() => r.hops && setSelectedPacket(r)}
                title="Click to inspect packet headers"
              >
                <span>
                  {r.status === 'SUCCESS'
                    ? `64 bytes from ${r.destination_ip}: icmp_seq=${idx + 1} ttl=${r.ttl} time=${r.total_latency_ms} ms (${r.hops?.length || 0} hops)`
                    : `Request timeout / Destination unreachable: ${r.details}`}
                </span>
                {r.hops && (
                  <span style={{ textDecoration: 'underline', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                    [Inspect]
                  </span>
                )}
              </div>
            ))}

            {results.length === 0 && !isRunning && (
              <div style={{ color: 'var(--text-muted)' }}>Ready to transmit echo requests. Click "Ping" above.</div>
            )}
          </div>

          {results.length > 0 && !isRunning && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Packets: {results.length} transmitted, {successCount} received, {lossPct}% packet loss</span>
              <span>Avg RTT: <strong>{avgRtt} ms</strong></span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <PacketInspectorModal
        isOpen={!!selectedPacket}
        onClose={() => setSelectedPacket(null)}
        packet={selectedPacket}
      />
    </div>
  );
}
