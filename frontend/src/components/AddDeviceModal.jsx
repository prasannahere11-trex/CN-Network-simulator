import React, { useState, useEffect } from 'react';
import { DEVICE_TYPES, DEVICE_STATUSES, AREA_TYPES } from '../data/constants';
import { createDevice, getDevices } from '../services/deviceService';
import { createLink } from '../services/simulationService';

const QUICK_TEMPLATES = [
  {
    label: '💻 Workstation PC',
    type: 'PC',
    area: 'LAN',
    prefix: 'PC',
    ipPrefix: '192.168.10.',
    mask: '255.255.255.0',
    gateway: '192.168.10.254',
    location: 'CSE Lab Station',
    defaultLinkType: 'Ethernet',
    defaultBw: 1000,
  },
  {
    label: '🔀 Access Switch',
    type: 'Switch',
    area: 'LAN',
    prefix: 'SW',
    ipPrefix: '192.168.10.',
    mask: '255.255.255.0',
    gateway: '192.168.10.254',
    location: 'Building Switch Rack',
    defaultLinkType: 'Ethernet',
    defaultBw: 1000,
  },
  {
    label: '🌐 Core Router',
    type: 'Router',
    area: 'MAN',
    prefix: 'RT',
    ipPrefix: '10.0.',
    mask: '255.255.0.0',
    gateway: '10.0.0.2',
    location: 'Central Campus NOC',
    defaultLinkType: 'Fiber',
    defaultBw: 10000,
  },
  {
    label: '🗄️ Application Server',
    type: 'Server',
    area: 'LAN',
    prefix: 'SRV',
    ipPrefix: '172.16.0.',
    mask: '255.255.255.0',
    gateway: '172.16.0.1',
    location: 'Data Center Server Blade',
    defaultLinkType: 'Ethernet',
    defaultBw: 1000,
  },
  {
    label: '☁️ Edge WAN Gateway',
    type: 'Router',
    area: 'WAN',
    prefix: 'RT-WAN',
    ipPrefix: '203.0.113.',
    mask: '255.255.255.0',
    gateway: '203.0.113.254',
    location: 'NOC ISP Demarcation',
    defaultLinkType: 'Fiber',
    defaultBw: 5000,
  },
  {
    label: '📶 Wireless AP / IoT',
    type: 'PC',
    area: 'LAN',
    prefix: 'WAP',
    ipPrefix: '192.168.30.',
    mask: '255.255.255.0',
    gateway: '192.168.30.254',
    location: 'Campus WiFi Zone',
    defaultLinkType: 'Ethernet',
    defaultBw: 1000,
  },
];

export default function AddDeviceModal({ isOpen, onClose, onDeviceCreated, existingDevices = [] }) {
  const [deviceList, setDeviceList] = useState(existingDevices);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('PC');
  const [ipAddress, setIpAddress] = useState('192.168.10.15');
  const [status, setStatus] = useState('active');
  const [area, setArea] = useState('LAN');
  const [subnetMask, setSubnetMask] = useState('255.255.255.0');
  const [gateway, setGateway] = useState('192.168.10.254');
  const [location, setLocation] = useState('CSE Lab Station');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Quick Link Options
  const [autoConnect, setAutoConnect] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [linkType, setLinkType] = useState('Ethernet');
  const [bandwidthMbps, setBandwidthMbps] = useState(1000);

  // Fetch device list if not provided
  useEffect(() => {
    if (isOpen) {
      if (existingDevices && existingDevices.length > 0) {
        setDeviceList(existingDevices);
        if (!targetDeviceId && existingDevices.length > 0) {
          setTargetDeviceId(existingDevices[0].id);
        }
      } else {
        getDevices().then((devs) => {
          if (devs && devs.length > 0) {
            setDeviceList(devs);
            if (!targetDeviceId) setTargetDeviceId(devs[0].id);
          }
        }).catch(() => {});
      }
      // Apply initial smart proposal
      applyTemplate(QUICK_TEMPLATES[0], existingDevices);
    }
  }, [isOpen, existingDevices]);

  if (!isOpen) return null;

  function calculateNextId(prefix, devList) {
    const list = devList || deviceList;
    let count = 1;
    while (list.some((d) => d.id === `${prefix}-${String(count).padStart(3, '0')}` || d.id === `${prefix}-${count}`)) {
      count++;
    }
    return `${prefix}-${String(count).padStart(3, '0')}`;
  }

  function calculateNextIp(ipPrefix, devList) {
    const list = devList || deviceList;
    let lastOctet = 15;
    while (list.some((d) => d.ip_address === `${ipPrefix}${lastOctet}`)) {
      lastOctet++;
    }
    return `${ipPrefix}${lastOctet}`;
  }

  const applyTemplate = (template, currentList = deviceList) => {
    const nextId = calculateNextId(template.prefix, currentList);
    const nextIp = template.ipPrefix.endsWith('.') 
      ? calculateNextIp(template.ipPrefix, currentList) 
      : `${template.ipPrefix}1.1`;

    setId(nextId);
    setName(`${nextId}-Device`);
    setType(template.type);
    setArea(template.area);
    setIpAddress(nextIp);
    setSubnetMask(template.mask);
    setGateway(template.gateway);
    setLocation(template.location);
    setLinkType(template.defaultLinkType);
    setBandwidthMbps(template.defaultBw);
    setError(null);
  };

  const calculatePlacementCoordinates = (areaTier) => {
    // Distribute nicely based on area zone
    const count = deviceList.length;
    const jitterX = (count % 3) * 40;
    const jitterY = (count % 4) * 45;

    switch (areaTier) {
      case 'LAN':
        return { x: 140 + jitterX, y: 180 + jitterY };
      case 'MAN':
        return { x: 560 + jitterX, y: 220 + jitterY };
      case 'WAN':
        return { x: 920 + jitterX, y: 380 + jitterY };
      default:
        return { x: 300 + jitterX, y: 250 + jitterY };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!id.trim()) {
      setError('Device ID is required (e.g. PC-004, RT-003).');
      return;
    }
    if (!name.trim()) {
      setError('Device Label/Hostname is required.');
      return;
    }
    if (!ipAddress.trim()) {
      setError('Valid IPv4 address is required.');
      return;
    }

    if (deviceList.some((d) => d.id.toLowerCase() === id.trim().toLowerCase())) {
      setError(`A device with ID "${id.trim()}" already exists. Please pick a unique ID.`);
      return;
    }

    const { x, y } = calculatePlacementCoordinates(area);

    try {
      setLoading(true);
      const created = await createDevice({
        id: id.trim(),
        name: name.trim(),
        type,
        ip_address: ipAddress.trim(),
        status,
        area,
        subnet_mask: subnetMask.trim() || '255.255.255.0',
        gateway: gateway.trim() || undefined,
        location: location.trim() || `${area} Zone`,
        x,
        y,
      });

      // If auto-connect link requested
      if (autoConnect && targetDeviceId) {
        try {
          await createLink({
            source_id: created.id,
            target_id: targetDeviceId,
            bandwidth_mbps: parseFloat(bandwidthMbps) || 1000,
            latency_ms: linkType === 'Fiber' ? 1.5 : linkType === 'Serial/WAN' ? 15.0 : 1.0,
            loss_rate_percent: 0,
            status: 'UP',
            link_type: linkType,
          });
        } catch (linkErr) {
          console.warn('Auto-link creation warning:', linkErr);
        }
      }

      onClose();
      if (onDeviceCreated) {
        onDeviceCreated(created);
      }
    } catch (err) {
      setError(err.message || 'Failed to register device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Register Campus Network Device</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Add a workstation, switch, router, or server to the multi-area topology
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {error && (
              <div className="error-banner" style={{ marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Quick Templates Bar */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ Quick Auto-Fill Templates:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => applyTemplate(tmpl)}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

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
                  onChange={(e) => {
                    const newType = e.target.value;
                    setType(newType);
                  }}
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

            {/* Optional 1-Click Link Interconnect */}
            {deviceList.length > 0 && (
              <div style={{ marginTop: '0.5rem', padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={autoConnect}
                    onChange={(e) => setAutoConnect(e.target.checked)}
                  />
                  🔗 Connect immediately to an existing network node
                </label>

                {autoConnect && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Device</label>
                      <select
                        className="form-select"
                        value={targetDeviceId}
                        onChange={(e) => setTargetDeviceId(e.target.value)}
                      >
                        {deviceList.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.id} ({d.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Link Type</label>
                      <select
                        className="form-select"
                        value={linkType}
                        onChange={(e) => setLinkType(e.target.value)}
                      >
                        <option value="Ethernet">Ethernet</option>
                        <option value="Fiber">Fiber (10G)</option>
                        <option value="Serial/WAN">Serial/WAN</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Bandwidth</label>
                      <select
                        className="form-select"
                        value={bandwidthMbps}
                        onChange={(e) => setBandwidthMbps(Number(e.target.value))}
                      >
                        <option value={100}>100 Mbps</option>
                        <option value={1000}>1 Gbps</option>
                        <option value={10000}>10 Gbps</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              {loading ? 'Registering...' : '+ Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
