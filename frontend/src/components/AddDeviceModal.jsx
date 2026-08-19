import React, { useState } from 'react';
import { DEVICE_TYPES, DEVICE_STATUSES, AREA_TYPES } from '../data/constants';
import { createDevice } from '../services/deviceService';

export default function AddDeviceModal({ isOpen, onClose, onDeviceCreated }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(DEVICE_TYPES[0].value);
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState(DEVICE_STATUSES[0].value);
  const [area, setArea] = useState(AREA_TYPES[0].value);
  const [subnetMask, setSubnetMask] = useState('255.255.255.0');
  const [gateway, setGateway] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!id.trim()) {
      setError('Device ID is required (e.g. PC-001, RT-001).');
      return;
    }
    if (!name.trim()) {
      setError('Device Name is required.');
      return;
    }
    if (!ipAddress.trim()) {
      setError('Valid IPv4 address is required.');
      return;
    }

    try {
      setLoading(true);
      await createDevice({
        id: id.trim(),
        name: name.trim(),
        type,
        ip_address: ipAddress.trim(),
        status,
        area,
        subnet_mask: subnetMask.trim() || '255.255.255.0',
        gateway: gateway.trim() || undefined,
        location: location.trim() || `${area} Zone`,
        x: Math.floor(Math.random() * 400 + 200),
        y: Math.floor(Math.random() * 300 + 150),
      });

      // Reset & close
      setId('');
      setName('');
      setIpAddress('');
      setGateway('');
      setLocation('');
      onClose();
      if (onDeviceCreated) {
        onDeviceCreated();
      }
    } catch (err) {
      setError(err.message || 'Failed to create device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Register Campus Network Device</h3>
          <button className="modal-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {error && <div className="error-banner">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Device ID *</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="e.g. PC-004, RT-003"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hardware Type *</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {DEVICE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Device Hostname / Label *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CSE-Lab-Host-04"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">IPv4 Address *</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="192.168.10.25"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subnet Mask</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="255.255.255.0"
                  value={subnetMask}
                  onChange={(e) => setSubnetMask(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Default Gateway</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="192.168.10.254"
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Network Area Tier *</label>
                <select
                  className="form-select"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  {AREA_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Operational Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {DEVICE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Campus Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CSE Dept Lab 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
              {loading ? 'Registering...' : 'Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
