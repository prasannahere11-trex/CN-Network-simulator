import React, { useState } from 'react';
import { createLink } from '../services/simulationService';

export default function AddLinkModal({ isOpen, onClose, devices = [], onLinkCreated }) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [bandwidth, setBandwidth] = useState('1000');
  const [latency, setLatency] = useState('2.0');
  const [lossRate, setLossRate] = useState('0.0');
  const [linkType, setLinkType] = useState('Ethernet');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validDevices = devices.filter((d) => d.status === 'active');
  const actualSource = sourceId || (validDevices[0] ? validDevices[0].id : '');
  const actualTarget = targetId || (validDevices[1] ? validDevices[1].id : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const src = sourceId || actualSource;
    const tgt = targetId || actualTarget;

    if (!src || !tgt) {
      setError('Please select both a source and target device.');
      return;
    }

    if (src === tgt) {
      setError('Source and target device cannot be the same.');
      return;
    }

    try {
      setLoading(true);
      await createLink({
        source_id: src,
        target_id: tgt,
        bandwidth_mbps: parseFloat(bandwidth) || 1000.0,
        latency_ms: parseFloat(latency) || 2.0,
        loss_rate_percent: parseFloat(lossRate) || 0.0,
        link_type: linkType,
        status: 'UP',
      });

      onClose();
      if (onLinkCreated) {
        onLinkCreated();
      }
    } catch (err) {
      setError(err.message || 'Failed to create link interconnect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Establish Link Interconnect</h3>
          <button className="modal-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Source Node *</label>
                <select
                  className="form-select"
                  value={sourceId || actualSource}
                  onChange={(e) => setSourceId(e.target.value)}
                  required
                >
                  {validDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Node *</label>
                <select
                  className="form-select"
                  value={targetId || actualTarget}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                >
                  {validDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Bandwidth (Mbps) *</label>
                <select
                  className="form-select"
                  value={bandwidth}
                  onChange={(e) => setBandwidth(e.target.value)}
                >
                  <option value="100">100 Mbps (FastEthernet)</option>
                  <option value="1000">1,000 Mbps (Gigabit Ethernet)</option>
                  <option value="5000">5,000 Mbps (5G Fiber Backbone)</option>
                  <option value="10000">10,000 Mbps (10G Core Fiber)</option>
                  <option value="10">10 Mbps (Serial WAN Link)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Physical Medium</label>
                <select
                  className="form-select"
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                >
                  <option value="Ethernet">Copper Twisted Pair (Ethernet)</option>
                  <option value="Fiber">Single/Multi-Mode Optical Fiber</option>
                  <option value="Serial/WAN">Serial / ISP Uplink</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Propagation Latency (ms)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="500"
                  className="form-input mono"
                  value={latency}
                  onChange={(e) => setLatency(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Packet Loss Probability (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input mono"
                  value={lossRate}
                  onChange={(e) => setLossRate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
