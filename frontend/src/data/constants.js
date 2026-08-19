/**
 * System Constants and Enums
 * Matches backend Pydantic models and API schemas exactly.
 */

export const DEVICE_TYPES = [
  { value: 'PC', label: 'PC (Workstation)', icon: '💻' },
  { value: 'Switch', label: 'Switch (L2/L3)', icon: '🔀' },
  { value: 'Router', label: 'Router (Gateway)', icon: '🌐' },
  { value: 'Server', label: 'Server (Host)', icon: '🗄️' },
];

export const DEVICE_STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'danger' },
  { value: 'standby', label: 'Standby', color: 'warning' },
];

export const AREA_TYPES = [
  { value: 'LAN', label: 'LAN (Local Area Network)', color: '#38bdf8' },
  { value: 'MAN', label: 'MAN (Metropolitan Area Network)', color: '#10b981' },
  { value: 'WAN', label: 'WAN (Wide Area Network)', color: '#f59e0b' },
];

export const PROTOCOL_TYPES = [
  { value: 'ICMP', label: 'ICMP (Ping / Echo)', desc: 'Network layer diagnostic & reachability test' },
  { value: 'TCP', label: 'TCP (3-Way Handshake + Data)', desc: 'Reliable connection-oriented transport protocol' },
  { value: 'UDP', label: 'UDP (Datagram Stream)', desc: 'Low-latency connectionless datagram transport' },
  { value: 'HTTP', label: 'HTTP (Web Application GET)', desc: 'Layer 7 web portal page request & HTTP 200 response' },
  { value: 'DNS', label: 'DNS (Domain Name Query)', desc: 'Layer 7 name resolution query to authoritative server' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', isReal: true },
  { id: 'topology', label: 'Network Topology', icon: '🗺️', isReal: true },
  { id: 'devices', label: 'Devices', icon: '🖥️', isReal: true },
  { id: 'packet-simulator', label: 'Packet Simulator', icon: '📦', isReal: true },
  { id: 'routing', label: 'Routing Protocols', icon: '🔀', isReal: true },
  { id: 'monitoring', label: 'Monitoring', icon: '📈', isReal: true },
  { id: 'simulation', label: 'Scenarios & Chaos', icon: '⚡', isReal: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', isReal: true },
];
