import React, { useState } from 'react';

export default function PacketInspectorModal({ isOpen, onClose, packet }) {
  const [activeLayer, setActiveLayer] = useState('l3'); // l2, l3, l4, l7, hops

  if (!isOpen || !packet) return null;

  const headers = packet.headers || {};
  const l2 = headers.layer2_ethernet || {};
  const l3 = headers.layer3_ip || {};
  const l4 = headers.layer4_transport || {};
  const l7 = headers.layer7_payload || {};
  const hops = packet.hops || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 className="modal-title">Deep Packet Dissector</h3>
              <span className="code-badge">{packet.id}</span>
              <span className={`status-badge ${packet.status === 'SUCCESS' ? 'active' : 'inactive'}`}>
                ● {packet.status}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {packet.source_name} ({packet.source_ip}) &rarr; {packet.destination_name} ({packet.destination_ip}) | {packet.protocol} Protocol
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        {/* Layer Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0 1rem' }}>
          {[
            { id: 'l2', label: 'Layer 2 (Data Link / MAC)' },
            { id: 'l3', label: 'Layer 3 (IPv4 Network)' },
            { id: 'l4', label: 'Layer 4 (Transport)' },
            { id: 'l7', label: 'Layer 7 (Application Payload)' },
            { id: 'hops', label: `Hop Path (${hops.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLayer(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                fontWeight: activeLayer === tab.id ? '600' : '500',
                color: activeLayer === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderBottom: activeLayer === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {activeLayer === 'l2' && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                IEEE 802.3 Ethernet Frame Header
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <HeaderField label="Source MAC Address" value={l2.source_mac} />
                <HeaderField label="Destination MAC Address" value={l2.destination_mac} />
                <HeaderField label="EtherType" value={l2.ether_type} />
                <HeaderField label="Preamble & SFD" value={l2.preamble} />
                <HeaderField label="Frame Check Sequence (CRC)" value={l2.frame_check_sequence} />
              </div>
            </div>
          )}

          {activeLayer === 'l3' && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Internet Protocol Version 4 (IPv4) Header
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <HeaderField label="Source IPv4 Address" value={l3.source_ip} highlight />
                <HeaderField label="Destination IPv4 Address" value={l3.destination_ip} highlight />
                <HeaderField label="IP Version / IHL" value={`v${l3.version} / ${l3.ihl}`} />
                <HeaderField label="Total Length" value={l3.total_length} />
                <HeaderField label="Time To Live (TTL)" value={l3.time_to_live} />
                <HeaderField label="Protocol Number" value={l3.protocol} />
                <HeaderField label="Identification" value={l3.identification} />
                <HeaderField label="Header Checksum" value={l3.header_checksum} />
                <HeaderField label="Flags & Fragment" value={`${l3.flags} (Offset: ${l3.fragment_offset})`} />
                <HeaderField label="DSCP / ECN" value={l3.dscp_ecn} />
              </div>
            </div>
          )}

          {activeLayer === 'l4' && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {l4.protocol} Transport Layer Segment Header
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {Object.entries(l4).map(([key, val]) => (
                  <HeaderField
                    key={key}
                    label={key.replace(/_/g, ' ').toUpperCase()}
                    value={String(val)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeLayer === 'l7' && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Application Protocol & Payload Data
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {l7.application && <HeaderField label="Application Protocol" value={l7.application} highlight />}
                {l7.request_line && <HeaderField label="HTTP Request Line" value={l7.request_line} />}
                {l7.query_name && <HeaderField label="DNS Query Name" value={l7.query_name} />}
                {l7.payload_snippet && (
                  <div>
                    <span className="stat-label">Payload Raw / Hex Snippet:</span>
                    <pre style={{
                      background: 'var(--bg-input)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--accent-emerald)',
                      overflowX: 'auto',
                      marginTop: '0.35rem'
                    }}>
                      {typeof l7.payload_snippet === 'object' ? JSON.stringify(l7.payload_snippet, null, 2) : l7.payload_snippet}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLayer === 'hops' && (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Hop-by-Hop Transmission Trace
              </div>
              {hops.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No intermediate hops recorded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {hops.map((h) => (
                    <div
                      key={h.hop_number}
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="code-badge" style={{ fontSize: '0.75rem' }}>Hop #{h.hop_number}</span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {h.from_device_name} &rarr; {h.to_device_name}
                          </strong>
                          <span className={`status-badge ${h.action === 'DROPPED' ? 'inactive' : 'active'}`}>
                            {h.action}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {h.description}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                        <div>{h.link_latency_ms} ms</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>TTL: {h.ttl_remaining}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderField({ label, value, highlight }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      padding: '0.6rem 0.75rem',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
        color: highlight ? 'var(--accent-cyan)' : 'var(--text-primary)',
        marginTop: '0.2rem',
        wordBreak: 'break-all'
      }}>
        {value !== undefined && value !== null ? String(value) : 'N/A'}
      </div>
    </div>
  );
}
