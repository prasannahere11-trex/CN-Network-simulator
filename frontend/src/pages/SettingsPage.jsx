import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, resetNetworkTopology, exportTopology, importTopology } from '../services/simulationService';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [globalLoss, setGlobalLoss] = useState(0.0);
  const [refBw, setRefBw] = useState(100000);
  const [mtu, setMtu] = useState(1500);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      if (data) {
        setSimSpeed(data.simulation_speed || 1.0);
        setGlobalLoss(data.global_loss_rate_percent || 0.0);
        setRefBw(data.ospf_reference_bandwidth_mbps || 100000);
        setMtu(data.default_mtu_bytes || 1500);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg(null);
      await updateSettings({
        simulation_speed: parseFloat(simSpeed),
        global_loss_rate_percent: parseFloat(globalLoss),
        ospf_reference_bandwidth_mbps: parseFloat(refBw),
        default_mtu_bytes: parseInt(mtu),
        auto_refresh_monitoring: true,
      });
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetTopology = async () => {
    if (!window.confirm('Are you sure you want to reset the network to factory default topology? All custom added nodes and severed links will be restored.')) {
      return;
    }
    try {
      await resetNetworkTopology();
      alert('Network reset to default multi-area topology successfully.');
      await fetchSettings();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const handleExportJson = async () => {
    try {
      const state = await exportTopology();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-network-topology-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        await importTopology(json);
        alert('Network topology imported successfully!');
        await fetchSettings();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-page" style={{ maxWidth: '800px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          Network Simulator Global Settings & Configuration
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Configure global packet simulation rules, OSPF metric calculations, and topology backup/restores
        </p>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--badge-active-bg)', border: '1px solid var(--badge-active-border)', color: 'var(--badge-active-text)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Global Settings Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Simulation Engine Parameters</h3>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Simulation Speed Multiplier</label>
              <select
                className="form-select"
                value={simSpeed}
                onChange={(e) => setSimSpeed(e.target.value)}
              >
                <option value="0.5">0.5x (Slow Motion Detailed)</option>
                <option value="1.0">1.0x (Real-time Standard)</option>
                <option value="2.0">2.0x (Fast 2x)</option>
                <option value="5.0">5.0x (Ultra Fast)</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Global Packet Loss (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                className="form-input mono"
                value={globalLoss}
                onChange={(e) => setGlobalLoss(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">OSPF Reference Bandwidth (Mbps)</label>
              <input
                type="number"
                step="1000"
                min="1000"
                className="form-input mono"
                value={refBw}
                onChange={(e) => setRefBw(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Default MTU Size (Bytes)</label>
              <input
                type="number"
                min="576"
                max="9000"
                className="form-input mono"
                value={mtu}
                onChange={(e) => setMtu(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </form>
      </div>

      {/* State Backup, Restore & Reset Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Topology Backup, Import & Factory Reset</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Export Topology to JSON</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Download entire multi-area configuration (devices, links, coordinates, and rules)
              </p>
            </div>
            <button className="btn btn-secondary" onClick={handleExportJson} type="button">
              📥 Export JSON
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Import Topology from JSON</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Load a previously saved campus network architecture file
              </p>
            </div>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              📤 Upload JSON
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-rose)' }}>Reset to Default Topology</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Restore the default 15-node, 3-tier LAN/MAN/WAN Campus Network with 100% active links
              </p>
            </div>
            <button className="btn btn-danger" onClick={handleResetTopology} type="button">
              🔄 Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
