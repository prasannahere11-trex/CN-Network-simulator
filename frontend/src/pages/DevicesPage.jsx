import React, { useState, useEffect } from 'react';
import { getDevices, deleteDevice, updateDevice } from '../services/deviceService';
import AddDeviceModal from '../components/AddDeviceModal';
import PingModal from '../components/PingModal';

export default function DevicesPage({ onDeviceChanged }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');

  // Ping Modal
  const [pingSource, setPingSource] = useState(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDevices();
      setDevices(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load devices from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (deviceId) => {
    if (!window.confirm(`Are you sure you want to remove device "${deviceId}" and all its connected links?`)) {
      return;
    }

    try {
      setDeletingId(deviceId);
      await deleteDevice(deviceId);
      await fetchDevices();
      if (onDeviceChanged) {
        onDeviceChanged();
      }
    } catch (err) {
      alert(`Error deleting device: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (dev) => {
    const newStatus = dev.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDevice(dev.id, { status: newStatus });
      await fetchDevices();
      if (onDeviceChanged) onDeviceChanged();
    } catch (err) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PC': return '💻';
      case 'Switch': return '🔀';
      case 'Router': return '🌐';
      case 'Server': return '🗄️';
      default: return '🖥️';
    }
  };

  const getAreaColor = (area) => {
    switch (area) {
      case 'LAN': return '#38bdf8';
      case 'MAN': return '#10b981';
      case 'WAN': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    const matchesArea = areaFilter === 'ALL' || d.area === areaFilter;

    return matchesSearch && matchesType && matchesArea;
  });

  return (
    <div className="devices-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Network Devices & Host Inventory
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Comprehensive inventory of campus workstations, aggregation switches, core routers, and server blades
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          type="button"
        >
          + Add Device
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <strong>Error connecting to backend:</strong> {error}
          <button
            onClick={fetchDevices}
            style={{ marginLeft: '1rem', background: 'none', border: 'underline', color: 'inherit', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search hostname, IP address, ID, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Hardware Types</option>
              <option value="PC">PCs / Workstations</option>
              <option value="Switch">Switches</option>
              <option value="Router">Routers</option>
              <option value="Server">Servers</option>
            </select>
          </div>

          <div>
            <select
              className="form-select"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="ALL">All Area Tiers</option>
              <option value="LAN">LAN (Local Depts)</option>
              <option value="MAN">MAN (Core Ring)</option>
              <option value="WAN">WAN (Edge / Cloud)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading network inventory...
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <h3 className="empty-state-title">No Devices Found</h3>
            <p className="empty-state-desc">
              No network devices match your current search filters.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Device Hostname</th>
                <th>Hardware Type</th>
                <th>Area Tier</th>
                <th>IP / Subnet Mask</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <span className="code-badge">{device.id}</span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{device.name}</strong>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {device.mac_address || '00:1A:2B:..'}
                    </div>
                  </td>
                  <td>
                    <span className="device-type-badge">
                      <span>{getTypeIcon(device.type)}</span>
                      <span>{device.type}</span>
                    </span>
                  </td>
                  <td>
                    <span className="code-badge" style={{ color: getAreaColor(device.area) }}>
                      {device.area}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                      {device.ip_address}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {device.subnet_mask}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: device.gateway ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                      {device.gateway || 'Direct'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(device)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Click to toggle status"
                    >
                      <span className={`status-badge ${device.status.toLowerCase()}`}>
                        ● {device.status}
                      </span>
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{device.location}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPingSource(device)}
                        type="button"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        title="Ping another device from here"
                      >
                        📡 Ping
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(device.id)}
                        disabled={deletingId === device.id}
                        type="button"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        title="Remove device from network"
                      >
                        {deletingId === device.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingDevices={devices}
        onDeviceCreated={async () => {
          await fetchDevices();
          if (onDeviceChanged) onDeviceChanged();
        }}
      />

      {/* Ping Modal */}
      <PingModal
        isOpen={!!pingSource}
        onClose={() => setPingSource(null)}
        sourceDevice={pingSource}
        devices={devices}
      />
    </div>
  );
}
