import React, { useState, useEffect } from 'react';
import { getDevices } from '../services/deviceService';
import { getDeviceRoutingTable, calculateShortestPath } from '../services/simulationService';

export default function RoutingPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [protocol, setProtocol] = useState('OSPF');
  const [routingTable, setRoutingTable] = useState(null);
  const [loadingTable, setLoadingTable] = useState(false);

  // Shortest Path Calculator
  const [pathSource, setPathSource] = useState('');
  const [pathDest, setPathDest] = useState('');
  const [pathResult, setPathResult] = useState(null);
  const [loadingPath, setLoadingPath] = useState(false);

  const loadDevices = async () => {
    try {
      const devs = await getDevices();
      setDevices(devs || []);

      const routers = (devs || []).filter((d) => d.type === 'Router' || d.type === 'Switch');
      if (routers.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(routers[0].id);
      }

      if (devs && devs.length >= 2) {
        if (!pathSource) setPathSource(devs[0].id);
        if (!pathDest) setPathDest(devs[devs.length - 1].id);
      }
    } catch (err) {
      console.warn('Failed to load devices for routing:', err);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  // Fetch routing table when device or protocol changes
  useEffect(() => {
    if (!selectedDeviceId) return;

    const fetchTable = async () => {
      try {
        setLoadingTable(true);
        const data = await getDeviceRoutingTable(selectedDeviceId, protocol);
        setRoutingTable(data);
      } catch (err) {
        console.warn('Failed to load routing table:', err);
        setRoutingTable(null);
      } finally {
        setLoadingTable(false);
      }
    };

    fetchTable();
  }, [selectedDeviceId, protocol]);

  const handleCalculatePath = async () => {
    if (!pathSource || !pathDest) return;
    try {
      setLoadingPath(true);
      const res = await calculateShortestPath(pathSource, pathDest, protocol);
      setPathResult(res);
    } catch (err) {
      alert(`Path Calculation Error: ${err.message}`);
    } finally {
      setLoadingPath(false);
    }
  };

  const selectedDev = devices.find((d) => d.id === selectedDeviceId);

  return (
    <div className="routing-page">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Dynamic Routing Protocols & Forwarding Tables
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Compare Link-State OSPF (Dijkstra SPF) vs Distance-Vector RIP (Bellman-Ford) routing convergence
          </p>
        </div>

        {/* Protocol Selector Pills */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {['OSPF', 'RIP', 'STATIC'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProtocol(p)}
              style={{
                background: protocol === p ? 'var(--accent-cyan)' : 'transparent',
                color: protocol === p ? '#000' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top Section: Algorithm Overview Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(22, 31, 48, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Link-State (OSPF)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Uses Dijkstra's Shortest Path First (SPF) algorithm. Metric cost is calculated inversely proportional to link bandwidth (100 Gbps / Bandwidth). Prefers optical fiber high-speed paths.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Distance-Vector (RIP)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Uses Bellman-Ford shortest hop count (max 15 hops). Treats all active links as metric cost 1 regardless of medium, prioritizing minimal physical hop transitions.
            </p>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Static & Default Gateways
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Deterministic route entries configured for campus host workstations and default gateway uplinks (0.0.0.0/0) pointing towards distribution routers.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Routing Table Inspector + Shortest Path Solver */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Dynamic Routing Table Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 className="card-title">Routing Table (FIB)</h3>
              {selectedDev && <span className="code-badge">{selectedDev.name}</span>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                className="form-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address}) [{d.type}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingTable ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Computing convergence for {selectedDev?.name}...
            </div>
          ) : !routingTable || routingTable.routes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active routes converged for this node.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Destination Network</th>
                    <th>Next Hop (Gateway)</th>
                    <th>Interface</th>
                    <th>Metric / Cost</th>
                    <th>Proto</th>
                  </tr>
                </thead>
                <tbody>
                  {routingTable.routes.map((rt, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {rt.destination_network}
                        </strong>
                      </td>
                      <td>
                        <span className="code-badge" style={{ color: 'var(--accent-cyan)' }}>
                          {rt.gateway}
                        </span>
                      </td>
                      <td>
                        <span className="code-badge">{rt.interface}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                        {rt.metric}
                      </td>
                      <td>
                        <span className="device-type-badge" style={{ fontSize: '0.7rem' }}>
                          {rt.protocol}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Shortest Path Explorer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Shortest Path Calculator</h3>
            <span className="code-badge">{protocol} Engine</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Source Node</label>
                <select
                  className="form-select"
                  value={pathSource}
                  onChange={(e) => setPathSource(e.target.value)}
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Destination Node</label>
                <select
                  className="form-select"
                  value={pathDest}
                  onChange={(e) => setPathDest(e.target.value)}
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCalculatePath}
              disabled={loadingPath || !pathSource || !pathDest}
              type="button"
              style={{ width: '100%' }}
            >
              {loadingPath ? 'Calculating SPF Tree...' : `Solve Path (${protocol})`}
            </button>
          </div>

          {pathResult && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              flex: 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className={`status-badge ${pathResult.reachable ? 'active' : 'inactive'}`}>
                  ● {pathResult.reachable ? 'Route Reachable' : 'Unreachable'}
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                  Est. Latency: <strong>{pathResult.estimated_latency_ms} ms</strong>
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                {pathResult.explanation}
              </div>

              {pathResult.path && pathResult.path.length > 0 && (
                <div>
                  <div className="stat-label" style={{ marginBottom: '0.5rem' }}>Egress Path Sequence:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                    {pathResult.path.map((nodeId, idx) => {
                      const dev = devices.find((d) => d.id === nodeId);
                      return (
                        <React.Fragment key={nodeId}>
                          <span className="code-badge" style={{ color: 'var(--text-primary)', padding: '0.3rem 0.6rem' }}>
                            {dev ? dev.name : nodeId}
                          </span>
                          {idx < pathResult.path.length - 1 && (
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>&rarr;</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <div className="stat-label">Metric Cost / Hops</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {pathResult.total_cost_or_hops}
                      </div>
                    </div>

                    <div>
                      <div className="stat-label">Bottleneck Bandwidth</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {pathResult.bottleneck_bandwidth_mbps} Mbps
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
