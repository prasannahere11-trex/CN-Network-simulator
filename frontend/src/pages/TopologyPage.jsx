import React, { useState, useEffect, useRef } from 'react';
import { getDevices, updateDevice, deleteDevice } from '../services/deviceService';
import { getLinks, toggleLink, deleteLink, sendPacket, getPresets, loadPreset } from '../services/simulationService';
import AddDeviceModal from '../components/AddDeviceModal';
import AddLinkModal from '../components/AddLinkModal';
import PingModal from '../components/PingModal';
import PacketInspectorModal from '../components/PacketInspectorModal';

export default function TopologyPage({ onDeviceChanged }) {
  const [devices, setDevices] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('enterprise-campus');
  const [loadingPreset, setLoadingPreset] = useState(false);

  // Modals
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [pingSource, setPingSource] = useState(null);
  const [lastPacketResult, setLastPacketResult] = useState(null);

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [animatingHops, setAnimatingHops] = useState([]);

  const svgRef = useRef(null);

  const fetchTopologyData = async () => {
    try {
      setLoading(true);
      const [devs, lks, presetList] = await Promise.all([
        getDevices(),
        getLinks(),
        getPresets().catch(() => [])
      ]);
      setDevices(devs || []);
      setLinks(lks || []);
      if (presetList && presetList.length > 0) {
        setPresets(presetList);
      }
    } catch (err) {
      console.warn('Failed to load topology:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopologyData();
  }, []);

  const handleLoadPreset = async (presetId) => {
    try {
      setLoadingPreset(true);
      setSelectedPresetId(presetId);
      setSelectedNode(null);
      setSelectedLink(null);
      await loadPreset(presetId);
      await fetchTopologyData();
      if (onDeviceChanged) onDeviceChanged();
    } catch (err) {
      alert(`Failed to load preset structure: ${err.message}`);
    } finally {
      setLoadingPreset(false);
    }
  };

  // Node Drag Handlers
  const handleMouseDown = (e, dev) => {
    e.stopPropagation();
    setSelectedNode(dev);
    setSelectedLink(null);

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    setDraggingNodeId(dev.id);
    setDragOffset({
      x: e.clientX - svgRect.left - (dev.x || 100),
      y: e.clientY - svgRect.top - (dev.y || 100),
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingNodeId) return;
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const newX = Math.max(30, Math.min(1180, e.clientX - svgRect.left - dragOffset.x));
    const newY = Math.max(30, Math.min(580, e.clientY - svgRect.top - dragOffset.y));

    setDevices((prev) =>
      prev.map((d) => (d.id === draggingNodeId ? { ...d, x: newX, y: newY } : d))
    );
  };

  const handleMouseUp = async () => {
    if (draggingNodeId) {
      const movedDev = devices.find((d) => d.id === draggingNodeId);
      if (movedDev) {
        try {
          await updateDevice(movedDev.id, { x: movedDev.x, y: movedDev.y });
        } catch (err) {
          console.warn('Failed to save node coordinates:', err);
        }
      }
      setDraggingNodeId(null);
    }
  };

  const handleToggleLinkStatus = async (linkId) => {
    try {
      const updated = await toggleLink(linkId);
      setLinks((prev) => prev.map((l) => (l.id === linkId ? updated : l)));
      if (selectedLink && selectedLink.id === linkId) {
        setSelectedLink(updated);
      }
    } catch (err) {
      alert(`Error toggling link: ${err.message}`);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm(`Are you sure you want to remove link "${linkId}"?`)) return;
    try {
      await deleteLink(linkId);
      setSelectedLink(null);
      await fetchTopologyData();
    } catch (err) {
      alert(`Error deleting link: ${err.message}`);
    }
  };

  const handleQuickPing = async (srcId, dstId) => {
    try {
      const res = await sendPacket({
        source_id: srcId,
        destination_id: dstId,
        protocol: 'ICMP',
        size_bytes: 64,
        ttl: 64,
        payload: 'Interactive Canvas Ping',
      });
      setLastPacketResult(res);

      if (res.hops && res.hops.length > 0) {
        setAnimatingHops(res.hops);
        setTimeout(() => setAnimatingHops([]), 3500);
      }
    } catch (err) {
      alert(`Ping failed: ${err.message}`);
    }
  };

  const getNodeIcon = (type) => {
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

  return (
    <div className="topology-page" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="topology-workspace" style={{ height: 'calc(100vh - 170px)', minHeight: '620px' }}>
        {/* Workspace Toolbar Header */}
        <div className="topology-toolbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Multi-Area Campus Network Topology Canvas
              </h2>
              <span className="code-badge" style={{ fontSize: '0.75rem' }}>
                {devices.length} Nodes / {links.length} Links
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Interactive live canvas: Drag nodes, click links to sever/cut fiber cables, inspect routes & simulate packet flows
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Sample Structures & Presets Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>📁 Structure:</span>
              <select
                className="form-select"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', maxWidth: '220px' }}
                value={selectedPresetId}
                onChange={(e) => handleLoadPreset(e.target.value)}
                disabled={loadingPreset}
              >
                {presets.length > 0 ? (
                  presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="enterprise-campus">Enterprise 3-Tier Campus</option>
                    <option value="star-lan">Department Star LAN</option>
                    <option value="redundant-ring">Redundant MAN Mesh Ring</option>
                    <option value="hybrid-cloud-wan">Multi-Branch Hybrid WAN</option>
                    <option value="p2p-lab">Point-to-Point 2-Host Lab</option>
                    <option value="blank-canvas">Blank Canvas (Clean Slate)</option>
                  </>
                )}
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={fetchTopologyData}
              type="button"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              title="Refresh canvas data"
            >
              🔄 Refresh
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsAddLinkOpen(true)}
              type="button"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem' }}
              disabled={devices.length < 2}
            >
              ⚡ Connect Link
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsAddDeviceOpen(true)}
              type="button"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
            >
              + Add Device
            </button>
          </div>
        </div>

        {/* Interactive SVG Canvas Area */}
        <div className="topology-canvas-area" style={{ overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Rendering Campus Network Graph...
            </div>
          ) : (
            <svg
              ref={svgRef}
              style={{ width: '100%', height: '100%', minWidth: '1200px', minHeight: '600px', cursor: draggingNodeId ? 'grabbing' : 'default' }}
              viewBox="0 0 1200 600"
              onClick={() => { setSelectedNode(null); setSelectedLink(null); }}
            >
              {/* Defs for gradients, patterns, and markers */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
                </pattern>
                
                {/* Glow Filter for Active Links */}
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Subnet Area Zone Annotations */}
              {/* LAN 1: CSE */}
              <rect x="50" y="80" width="420" height="250" rx="14" fill="rgba(56, 189, 248, 0.04)" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="5 5" />
              <text x="70" y="110" fill="#38bdf8" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                AREA 1: LAN (Local Subnet / Access Layer)
              </text>

              {/* LAN 2: ECE */}
              <rect x="50" y="370" width="420" height="180" rx="14" fill="rgba(168, 85, 247, 0.04)" stroke="rgba(168, 85, 247, 0.25)" strokeDasharray="5 5" />
              <text x="70" y="400" fill="#c084fc" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                AREA 2: LAN (Department / Workstation Tier)
              </text>

              {/* MAN: Campus Inter-Building Backbone */}
              <rect x="510" y="80" width="290" height="470" rx="14" fill="rgba(16, 185, 129, 0.04)" stroke="rgba(16, 185, 129, 0.25)" strokeDasharray="5 5" />
              <text x="530" y="110" fill="#10b981" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                AREA 0: MAN Backbone (Core Ring & Aggregation)
              </text>

              {/* Data Center / Servers */}
              <rect x="830" y="80" width="330" height="210" rx="14" fill="rgba(59, 130, 246, 0.04)" stroke="rgba(59, 130, 246, 0.25)" strokeDasharray="5 5" />
              <text x="850" y="110" fill="#60a5fa" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                CAMPUS DATA CENTER / SERVER VAULT
              </text>

              {/* WAN: ISP / Cloud */}
              <rect x="830" y="370" width="330" height="180" rx="14" fill="rgba(245, 158, 11, 0.04)" stroke="rgba(245, 158, 11, 0.25)" strokeDasharray="5 5" />
              <text x="850" y="400" fill="#fbbf24" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                WAN EDGE GATEWAY & PUBLIC CLOUD
              </text>

              {/* Render Links */}
              {links.map((lk) => {
                const srcNode = devices.find((d) => d.id === lk.source_id);
                const tgtNode = devices.find((d) => d.id === lk.target_id);
                if (!srcNode || !tgtNode) return null;

                const x1 = srcNode.x || 100;
                const y1 = srcNode.y || 100;
                const x2 = tgtNode.x || 100;
                const y2 = tgtNode.y || 100;
                const isSelected = selectedLink?.id === lk.id;
                const isDown = lk.status === 'DOWN';
                const isFiber = lk.link_type === 'Fiber';

                const strokeColor = isDown
                  ? '#f43f5e'
                  : isFiber
                  ? '#38bdf8'
                  : lk.link_type === 'Serial/WAN'
                  ? '#f59e0b'
                  : '#10b981';

                const strokeWidth = isSelected ? 4 : isFiber ? 2.5 : 2;

                return (
                  <g
                    key={lk.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLink(lk);
                      setSelectedNode(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Transparent thick hit area */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="18" />

                    {/* Main Line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isDown ? '6,6' : 'none'}
                      opacity={isDown ? 0.6 : 0.9}
                      filter={isSelected ? 'url(#glow-cyan)' : 'none'}
                    />

                    {/* Bandwidth / Latency Badge on Midpoint */}
                    <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                      <rect
                        x="-36"
                        y="-10"
                        width="72"
                        height="20"
                        rx="4"
                        fill="rgba(17, 24, 39, 0.85)"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {isDown ? 'CUT/DOWN' : `${lk.bandwidth_mbps >= 1000 ? `${lk.bandwidth_mbps / 1000}G` : `${lk.bandwidth_mbps}M`} | ${lk.latency_ms}ms`}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Animated Packet Transits */}
              {animatingHops.map((h, idx) => {
                const srcNode = devices.find((d) => d.id === h.from_device_id);
                const tgtNode = devices.find((d) => d.id === h.to_device_id);
                if (!srcNode || !tgtNode) return null;

                return (
                  <circle
                    key={`${h.hop_number}-${idx}`}
                    r="6"
                    fill="#38bdf8"
                    filter="url(#glow-cyan)"
                  >
                    <animate
                      attributeName="cx"
                      from={srcNode.x || 100}
                      to={tgtNode.x || 100}
                      dur="0.8s"
                      begin={`${idx * 0.7}s`}
                      fill="freeze"
                    />
                    <animate
                      attributeName="cy"
                      from={srcNode.y || 100}
                      to={tgtNode.y || 100}
                      dur="0.8s"
                      begin={`${idx * 0.7}s`}
                      fill="freeze"
                    />
                  </circle>
                );
              })}

              {/* Render Device Nodes */}
              {devices.map((dev) => {
                const isSelected = selectedNode?.id === dev.id;
                const areaColor = getAreaColor(dev.area);
                const isInactive = dev.status === 'inactive';

                return (
                  <g
                    key={dev.id}
                    transform={`translate(${dev.x || 100}, ${dev.y || 100})`}
                    onMouseDown={(e) => handleMouseDown(e, dev)}
                    style={{ cursor: draggingNodeId === dev.id ? 'grabbing' : 'grab' }}
                  >
                    {/* Node Background Halo if selected */}
                    {isSelected && (
                      <circle
                        r="32"
                        fill="none"
                        stroke="var(--accent-cyan)"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        opacity="0.8"
                      />
                    )}

                    {/* Outer Circle Container */}
                    <circle
                      r="24"
                      fill="var(--bg-card)"
                      stroke={isSelected ? 'var(--accent-cyan)' : areaColor}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={isInactive ? 0.4 : 1}
                      filter={isSelected ? 'url(#glow-cyan)' : 'none'}
                    />

                    {/* Status Indicator Dot */}
                    <circle
                      cx="16"
                      cy="-16"
                      r="5"
                      fill={isInactive ? '#f43f5e' : '#10b981'}
                      stroke="var(--bg-card)"
                      strokeWidth="1.5"
                    />

                    {/* Device Icon */}
                    <text
                      x="0"
                      y="6"
                      textAnchor="middle"
                      fontSize="18"
                      style={{ userSelect: 'none' }}
                    >
                      {getNodeIcon(dev.type)}
                    </text>

                    {/* Device ID Label */}
                    <text
                      x="0"
                      y="38"
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="sans-serif"
                      style={{ userSelect: 'none' }}
                    >
                      {dev.id}
                    </text>

                    {/* Device IP Address Label */}
                    <text
                      x="0"
                      y="50"
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="9.5"
                      fontFamily="monospace"
                      style={{ userSelect: 'none' }}
                    >
                      {dev.ip_address}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Quick Node Details Slideover / Card */}
          {selectedNode && (
            <div className="topology-inspector-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getNodeIcon(selectedNode.type)}</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{selectedNode.name}</strong>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem', marginBottom: '1rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <strong className="mono">{selectedNode.id}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <strong>{selectedNode.type}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>IP:</span> <strong className="mono">{selectedNode.ip_address}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Area:</span> <span className="code-badge">{selectedNode.area}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gateway:</span> <span className="mono">{selectedNode.gateway || 'None'}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`status-pill ${selectedNode.status}`}>{selectedNode.status}</span></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Location:</span> <span>{selectedNode.location}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPingSource(selectedNode)}
                  style={{ fontSize: '0.78rem', padding: '0.45rem', flex: 1 }}
                >
                  📡 Send Packet Ping
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const otherDev = devices.find((d) => d.id !== selectedNode.id && d.status === 'active');
                    if (otherDev) handleQuickPing(selectedNode.id, otherDev.id);
                  }}
                  style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                  title="Quick ping first available host"
                >
                  ⚡ Auto Ping
                </button>
              </div>
            </div>
          )}

          {/* Quick Link Inspector Card */}
          {selectedLink && (
            <div className="topology-inspector-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>🔗 Link Inspector</strong>
                <button
                  onClick={() => setSelectedLink(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <strong className="mono">{selectedLink.id}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Source:</span> <strong className="mono">{selectedLink.source_id}</strong> &rarr; <span style={{ color: 'var(--text-muted)' }}>Target:</span> <strong className="mono">{selectedLink.target_id}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <strong>{selectedLink.link_type}</strong> | <span style={{ color: 'var(--text-muted)' }}>Bandwidth:</span> <strong>{selectedLink.bandwidth_mbps} Mbps</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Latency:</span> <strong>{selectedLink.latency_ms} ms</strong> | <span style={{ color: 'var(--text-muted)' }}>Loss Rate:</span> <strong>{selectedLink.loss_rate_percent}%</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`status-pill ${selectedLink.status === 'UP' ? 'active' : 'inactive'}`}>{selectedLink.status}</span></div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${selectedLink.status === 'UP' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleToggleLinkStatus(selectedLink.id)}
                  style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                >
                  {selectedLink.status === 'UP' ? '✂️ Cut Cable (Set DOWN)' : '🔌 Repair (Set UP)'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDeleteLink(selectedLink.id)}
                  style={{ fontSize: '0.78rem', padding: '0.45rem' }}
                >
                  🗑️ Delete Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        existingDevices={devices}
        onDeviceCreated={async () => {
          await fetchTopologyData();
          if (onDeviceChanged) onDeviceChanged();
        }}
      />

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        devices={devices}
        onLinkCreated={fetchTopologyData}
      />

      {/* Ping Modal */}
      <PingModal
        isOpen={!!pingSource}
        onClose={() => setPingSource(null)}
        sourceDevice={pingSource}
        devices={devices}
      />

      {/* Packet Inspector Modal for canvas quick ping */}
      <PacketInspectorModal
        isOpen={!!lastPacketResult}
        onClose={() => setLastPacketResult(null)}
        packet={lastPacketResult}
      />
    </div>
  );
}
