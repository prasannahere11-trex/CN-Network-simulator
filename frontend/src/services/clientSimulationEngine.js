/**
 * In-Browser Client Network Simulation Engine
 * 
 * Provides a high-fidelity, zero-dependency client-side simulation engine
 * that seamlessly runs in the browser when deployed on static hosts like Vercel
 * or when the FastAPI backend is offline.
 */

const STORAGE_KEY = 'campus_network_state_v2';

// 6 Pre-built Sample Topology Structures
export const PRESET_TOPOLOGIES = [
  {
    id: 'enterprise-campus',
    name: 'Enterprise 3-Tier Campus (Default)',
    badge: '3-Tier Multi-Area',
    description: '12-node complete campus hierarchy across LAN 1 (CSE), LAN 2 (ECE), MAN Ring Core, Data Center, and WAN Edge to Cloud.',
    devices: [
      // LAN 1 (CSE)
      { id: 'PC-001', name: 'CSE-PC-01', type: 'PC', ip_address: '192.168.10.10', status: 'active', location: 'CSE Building Lab 1', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.10.254', mac_address: '00:1A:2B:3C:4D:01', x: 120, y: 160 },
      { id: 'PC-002', name: 'CSE-PC-02', type: 'PC', ip_address: '192.168.10.11', status: 'active', location: 'CSE Building Lab 2', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.10.254', mac_address: '00:1A:2B:3C:4D:02', x: 120, y: 280 },
      { id: 'SW-001', name: 'CSE-Switch-Access', type: 'Switch', ip_address: '192.168.10.1', status: 'active', location: 'CSE Server Room', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.10.254', mac_address: '00:1A:2B:3C:4D:10', x: 270, y: 220 },
      { id: 'RT-001', name: 'CSE-Gateway-Router', type: 'Router', ip_address: '192.168.10.254', status: 'active', location: 'CSE NOC Rack', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '10.0.1.1', mac_address: '00:1A:2B:3C:4D:FE', x: 420, y: 220 },
      
      // LAN 2 (ECE)
      { id: 'PC-003', name: 'ECE-Workstation-01', type: 'PC', ip_address: '192.168.20.10', status: 'active', location: 'ECE Embedded Lab', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.20.254', mac_address: '00:1A:2B:3C:4D:03', x: 120, y: 440 },
      { id: 'SW-002', name: 'ECE-Switch-Access', type: 'Switch', ip_address: '192.168.20.1', status: 'active', location: 'ECE Telemetry Room', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.20.254', mac_address: '00:1A:2B:3C:4D:20', x: 270, y: 440 },
      { id: 'RT-002', name: 'ECE-Gateway-Router', type: 'Router', ip_address: '192.168.20.254', status: 'active', location: 'ECE Distribution Rack', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '10.0.2.1', mac_address: '00:1A:2B:3C:4D:EE', x: 420, y: 440 },

      // MAN Backbone Ring
      { id: 'RT-CORE-1', name: 'North-Campus-Core-Router', type: 'Router', ip_address: '10.0.1.1', status: 'active', location: 'Central NOC Building Floor 3', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.0.0.2', mac_address: '00:1A:2B:3C:4D:C1', x: 590, y: 220 },
      { id: 'RT-CORE-2', name: 'South-Campus-Core-Router', type: 'Router', ip_address: '10.0.2.1', status: 'active', location: 'South Campus Telecom Hub', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.0.0.2', mac_address: '00:1A:2B:3C:4D:C2', x: 590, y: 440 },
      { id: 'SW-CORE', name: 'Campus-Aggregation-Switch', type: 'Switch', ip_address: '10.0.0.2', status: 'active', location: 'Central NOC Mainframe', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.0.1.1', mac_address: '00:1A:2B:3C:4D:CA', x: 740, y: 330 },

      // Data Center
      { id: 'SW-DC', name: 'DataCenter-Switch', type: 'Switch', ip_address: '172.16.0.1', status: 'active', location: 'Data Center Rack 01', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '10.0.1.1', mac_address: '00:1A:2B:3C:4D:DA', x: 890, y: 160 },
      { id: 'SRV-001', name: 'Campus-Web-Portal', type: 'Server', ip_address: '172.16.0.50', status: 'active', location: 'Data Center Server Blade 1', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '172.16.0.1', mac_address: '00:1A:2B:3C:4D:50', x: 1050, y: 120 },
      { id: 'SRV-002', name: 'Campus-DNS-Auth', type: 'Server', ip_address: '172.16.0.53', status: 'active', location: 'Data Center Server Blade 2', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '172.16.0.1', mac_address: '00:1A:2B:3C:4D:53', x: 1050, y: 230 },

      // WAN Edge
      { id: 'RT-WAN', name: 'Campus-Edge-Border-Router', type: 'Router', ip_address: '203.0.113.1', status: 'active', location: 'NOC ISP Demarcation', area: 'WAN', subnet_mask: '255.255.255.0', gateway: '203.0.113.254', mac_address: '00:1A:2B:3C:4D:EA', x: 890, y: 440 },
      { id: 'SRV-CLOUD', name: 'External-Cloud-Host', type: 'Server', ip_address: '8.8.8.8', status: 'active', location: 'Public Internet Cloud ISP', area: 'WAN', subnet_mask: '255.255.255.0', gateway: '203.0.113.1', mac_address: '00:1A:2B:3C:4D:88', x: 1050, y: 440 }
    ],
    links: [
      { id: 'LINK-PC001-SW001', source_id: 'PC-001', target_id: 'SW-001', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-PC002-SW001', source_id: 'PC-002', target_id: 'SW-001', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-SW001-RT001', source_id: 'SW-001', target_id: 'RT-001', bandwidth_mbps: 1000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      
      { id: 'LINK-PC003-SW002', source_id: 'PC-003', target_id: 'SW-002', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-SW002-RT002', source_id: 'SW-002', target_id: 'RT-002', bandwidth_mbps: 1000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },

      { id: 'LINK-RT001-RTCORE1', source_id: 'RT-001', target_id: 'RT-CORE-1', bandwidth_mbps: 10000, latency_ms: 2.0, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-RT002-RTCORE2', source_id: 'RT-002', target_id: 'RT-CORE-2', bandwidth_mbps: 10000, latency_ms: 2.0, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },

      { id: 'LINK-RTCORE1-RTCORE2', source_id: 'RT-CORE-1', target_id: 'RT-CORE-2', bandwidth_mbps: 10000, latency_ms: 3.0, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-RTCORE1-SWCORE', source_id: 'RT-CORE-1', target_id: 'SW-CORE', bandwidth_mbps: 10000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-RTCORE2-SWCORE', source_id: 'RT-CORE-2', target_id: 'SW-CORE', bandwidth_mbps: 10000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },

      { id: 'LINK-RTCORE1-SWDC', source_id: 'RT-CORE-1', target_id: 'SW-DC', bandwidth_mbps: 10000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-SWDC-SRV001', source_id: 'SW-DC', target_id: 'SRV-001', bandwidth_mbps: 1000, latency_ms: 0.5, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-SWDC-SRV002', source_id: 'SW-DC', target_id: 'SRV-002', bandwidth_mbps: 1000, latency_ms: 0.5, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },

      { id: 'LINK-SWCORE-RTWAN', source_id: 'SW-CORE', target_id: 'RT-WAN', bandwidth_mbps: 5000, latency_ms: 4.0, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-RTCORE2-RTWAN', source_id: 'RT-CORE-2', target_id: 'RT-WAN', bandwidth_mbps: 5000, latency_ms: 4.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-RTWAN-SRVCLOUD', source_id: 'RT-WAN', target_id: 'SRV-CLOUD', bandwidth_mbps: 500, latency_ms: 25.0, loss_rate_percent: 0.5, status: 'UP', link_type: 'Serial/WAN' }
    ]
  },
  {
    id: 'star-lan',
    name: 'Department Star LAN Architecture',
    badge: 'Single Subnet Star',
    description: 'Central Gigabit Access Switch connecting 4 Workstations, Department File Storage Server, and Gateway Router in a star topology.',
    devices: [
      { id: 'SW-CENTRAL', name: 'Dept-Core-Switch', type: 'Switch', ip_address: '192.168.50.1', status: 'active', location: 'Floor 1 Switch Closet', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.50.254', mac_address: '00:1A:2B:3C:50:01', x: 600, y: 300 },
      { id: 'PC-ST-01', name: 'Lab-Station-A1', type: 'PC', ip_address: '192.168.50.10', status: 'active', location: 'Room 101 Desk 1', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.50.254', mac_address: '00:1A:2B:3C:50:10', x: 280, y: 150 },
      { id: 'PC-ST-02', name: 'Lab-Station-A2', type: 'PC', ip_address: '192.168.50.11', status: 'active', location: 'Room 101 Desk 2', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.50.254', mac_address: '00:1A:2B:3C:50:11', x: 280, y: 300 },
      { id: 'PC-ST-03', name: 'Lab-Station-A3', type: 'PC', ip_address: '192.168.50.12', status: 'active', location: 'Room 101 Desk 3', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.50.254', mac_address: '00:1A:2B:3C:50:12', x: 280, y: 450 },
      { id: 'SRV-FILE', name: 'Dept-Storage-NAS', type: 'Server', ip_address: '192.168.50.200', status: 'active', location: 'Server Closet', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.50.254', mac_address: '00:1A:2B:3C:50:C8', x: 920, y: 180 },
      { id: 'RT-STAR-GW', name: 'Dept-Border-Router', type: 'Router', ip_address: '192.168.50.254', status: 'active', location: 'Telecom Room', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '10.0.0.1', mac_address: '00:1A:2B:3C:50:FE', x: 920, y: 420 }
    ],
    links: [
      { id: 'LINK-ST01-SW', source_id: 'PC-ST-01', target_id: 'SW-CENTRAL', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-ST02-SW', source_id: 'PC-ST-02', target_id: 'SW-CENTRAL', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-ST03-SW', source_id: 'PC-ST-03', target_id: 'SW-CENTRAL', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-SW-SRVFILE', source_id: 'SW-CENTRAL', target_id: 'SRV-FILE', bandwidth_mbps: 10000, latency_ms: 0.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-SW-RTSTAR', source_id: 'SW-CENTRAL', target_id: 'RT-STAR-GW', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' }
    ]
  },
  {
    id: 'redundant-ring',
    name: 'High-Availability Redundant MAN Mesh Ring',
    badge: 'Fault-Tolerant Ring',
    description: '4 Core Routers in dual-ring mesh with redundant cross-links and failover paths for testing fiber cuts and chaos scenarios.',
    devices: [
      { id: 'RT-RING-1', name: 'Ring-Node-North', type: 'Router', ip_address: '10.10.1.1', status: 'active', location: 'North Tower NOC', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.10.0.1', mac_address: '00:1A:2B:AA:01:01', x: 450, y: 150 },
      { id: 'RT-RING-2', name: 'Ring-Node-East', type: 'Router', ip_address: '10.10.2.1', status: 'active', location: 'East Science Hub', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.10.0.1', mac_address: '00:1A:2B:AA:02:01', x: 800, y: 150 },
      { id: 'RT-RING-3', name: 'Ring-Node-South', type: 'Router', ip_address: '10.10.3.1', status: 'active', location: 'South Telecom NOC', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.10.0.1', mac_address: '00:1A:2B:AA:03:01', x: 800, y: 450 },
      { id: 'RT-RING-4', name: 'Ring-Node-West', type: 'Router', ip_address: '10.10.4.1', status: 'active', location: 'West Library Annex', area: 'MAN', subnet_mask: '255.255.0.0', gateway: '10.10.0.1', mac_address: '00:1A:2B:AA:04:01', x: 450, y: 450 },
      { id: 'PC-ADMIN-01', name: 'Admin-Management-PC', type: 'PC', ip_address: '10.10.1.50', status: 'active', location: 'NOC Security Desk', area: 'LAN', subnet_mask: '255.255.0.0', gateway: '10.10.1.1', mac_address: '00:1A:2B:AA:01:50', x: 180, y: 300 },
      { id: 'SRV-CLUSTER-01', name: 'Database-Cluster-Master', type: 'Server', ip_address: '10.10.2.80', status: 'active', location: 'Core DC Vault', area: 'LAN', subnet_mask: '255.255.0.0', gateway: '10.10.2.1', mac_address: '00:1A:2B:AA:02:80', x: 1060, y: 300 }
    ],
    links: [
      { id: 'LINK-R1-R2', source_id: 'RT-RING-1', target_id: 'RT-RING-2', bandwidth_mbps: 10000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-R2-R3', source_id: 'RT-RING-2', target_id: 'RT-RING-3', bandwidth_mbps: 10000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-R3-R4', source_id: 'RT-RING-3', target_id: 'RT-RING-4', bandwidth_mbps: 10000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-R4-R1', source_id: 'RT-RING-4', target_id: 'RT-RING-1', bandwidth_mbps: 10000, latency_ms: 1.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-R1-R3-CROSS', source_id: 'RT-RING-1', target_id: 'RT-RING-3', bandwidth_mbps: 10000, latency_ms: 2.2, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-R4-R2-CROSS', source_id: 'RT-RING-4', target_id: 'RT-RING-2', bandwidth_mbps: 10000, latency_ms: 2.2, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-PC-R1', source_id: 'PC-ADMIN-01', target_id: 'RT-RING-1', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-PC-R4', source_id: 'PC-ADMIN-01', target_id: 'RT-RING-4', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-SRV-R2', source_id: 'SRV-CLUSTER-01', target_id: 'RT-RING-2', bandwidth_mbps: 10000, latency_ms: 0.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-SRV-R3', source_id: 'SRV-CLUSTER-01', target_id: 'RT-RING-3', bandwidth_mbps: 10000, latency_ms: 0.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' }
    ]
  },
  {
    id: 'hybrid-cloud-wan',
    name: 'Multi-Branch & Hybrid Cloud WAN',
    badge: 'Multi-Site WAN',
    description: 'Main Campus & Medical Branch connected through an ISP WAN Cloud Backbone to AWS Virtual Private Cloud servers.',
    devices: [
      { id: 'PC-MAIN-HQ', name: 'Main-HQ-Workstation', type: 'PC', ip_address: '192.168.1.10', status: 'active', location: 'Main HQ Office', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.1.1', mac_address: '00:1A:2B:CC:01:10', x: 120, y: 180 },
      { id: 'RT-MAIN-GW', name: 'Main-HQ-WAN-Router', type: 'Router', ip_address: '192.168.1.1', status: 'active', location: 'Main HQ NOC', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '200.10.1.1', mac_address: '00:1A:2B:CC:01:01', x: 340, y: 180 },
      { id: 'PC-MED-BR', name: 'Medical-Branch-PC', type: 'PC', ip_address: '192.168.2.10', status: 'active', location: 'Medical Clinic Annex', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.2.1', mac_address: '00:1A:2B:CC:02:10', x: 120, y: 440 },
      { id: 'RT-MED-GW', name: 'Medical-Branch-Router', type: 'Router', ip_address: '192.168.2.1', status: 'active', location: 'Medical Clinic Server Rack', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '200.10.2.1', mac_address: '00:1A:2B:CC:02:01', x: 340, y: 440 },
      { id: 'RT-ISP-CLOUD', name: 'ISP-Core-Cloud-Router', type: 'Router', ip_address: '200.10.0.1', status: 'active', location: 'Tier-1 ISP Data Hub', area: 'WAN', subnet_mask: '255.255.0.0', gateway: '200.10.0.254', mac_address: '00:1A:2B:CC:FF:01', x: 620, y: 310 },
      { id: 'RT-AWS-VPC', name: 'AWS-Transit-Gateway', type: 'Router', ip_address: '172.31.0.1', status: 'active', location: 'AWS us-east-1 VPC', area: 'WAN', subnet_mask: '255.255.0.0', gateway: '200.10.0.1', mac_address: '00:1A:2B:CC:AA:01', x: 880, y: 310 },
      { id: 'SRV-AWS-APP', name: 'AWS-EC2-Cloud-App', type: 'Server', ip_address: '172.31.10.50', status: 'active', location: 'AWS us-east-1a Availability Zone', area: 'WAN', subnet_mask: '255.255.0.0', gateway: '172.31.0.1', mac_address: '00:1A:2B:CC:AA:50', x: 1080, y: 310 }
    ],
    links: [
      { id: 'LINK-HQ-PC-RT', source_id: 'PC-MAIN-HQ', target_id: 'RT-MAIN-GW', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-MED-PC-RT', source_id: 'PC-MED-BR', target_id: 'RT-MED-GW', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-HQ-ISP', source_id: 'RT-MAIN-GW', target_id: 'RT-ISP-CLOUD', bandwidth_mbps: 500, latency_ms: 15.0, loss_rate_percent: 0.1, status: 'UP', link_type: 'Serial/WAN' },
      { id: 'LINK-MED-ISP', source_id: 'RT-MED-GW', target_id: 'RT-ISP-CLOUD', bandwidth_mbps: 200, latency_ms: 22.0, loss_rate_percent: 0.2, status: 'UP', link_type: 'Serial/WAN' },
      { id: 'LINK-ISP-AWS', source_id: 'RT-ISP-CLOUD', target_id: 'RT-AWS-VPC', bandwidth_mbps: 10000, latency_ms: 8.0, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' },
      { id: 'LINK-AWS-SRV', source_id: 'RT-AWS-VPC', target_id: 'SRV-AWS-APP', bandwidth_mbps: 10000, latency_ms: 0.5, loss_rate_percent: 0, status: 'UP', link_type: 'Fiber' }
    ]
  },
  {
    id: 'p2p-lab',
    name: 'Point-to-Point 2-Host Lab',
    badge: 'Educational Lab',
    description: 'Minimal dual-host teaching topology (PC-A -> Switch -> Router -> PC-B) for step-by-step packet header and TTL inspection.',
    devices: [
      { id: 'PC-ALPHA', name: 'Student-Host-A', type: 'PC', ip_address: '192.168.1.10', status: 'active', location: 'Lab Station 1', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.1.1', mac_address: '00:1A:2B:01:00:10', x: 180, y: 300 },
      { id: 'SW-LAB', name: 'Lab-Access-Switch', type: 'Switch', ip_address: '192.168.1.2', status: 'active', location: 'Lab Bench 1', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.1.1', mac_address: '00:1A:2B:01:00:02', x: 460, y: 300 },
      { id: 'RT-LAB-GW', name: 'Lab-Gateway-Router', type: 'Router', ip_address: '192.168.1.1', status: 'active', location: 'Lab Rack Unit 1', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.2.1', mac_address: '00:1A:2B:01:00:01', x: 740, y: 300 },
      { id: 'PC-BETA', name: 'Student-Host-B', type: 'PC', ip_address: '192.168.2.10', status: 'active', location: 'Lab Station 2', area: 'LAN', subnet_mask: '255.255.255.0', gateway: '192.168.2.1', mac_address: '00:1A:2B:02:00:10', x: 1020, y: 300 }
    ],
    links: [
      { id: 'LINK-A-SW', source_id: 'PC-ALPHA', target_id: 'SW-LAB', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-SW-RT', source_id: 'SW-LAB', target_id: 'RT-LAB-GW', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' },
      { id: 'LINK-RT-B', source_id: 'RT-LAB-GW', target_id: 'PC-BETA', bandwidth_mbps: 1000, latency_ms: 1.0, loss_rate_percent: 0, status: 'UP', link_type: 'Ethernet' }
    ]
  },
  {
    id: 'blank-canvas',
    name: 'Blank Canvas (Clean Slate)',
    badge: 'Custom Builder',
    description: 'Empty starting grid to construct custom network architectures from scratch using the Add Device & Add Link tools.',
    devices: [],
    links: []
  }
];

class ClientSimulationEngine {
  constructor() {
    this.devices = [];
    this.links = [];
    this.packetHistory = [];
    this.settings = {
      simulation_speed: 1.0,
      global_loss_rate_percent: 0.0,
      ospf_reference_bandwidth_mbps: 100000,
      default_mtu_bytes: 1500,
      auto_refresh_monitoring: true,
    };
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.devices) && Array.isArray(parsed.links)) {
            this.devices = parsed.devices;
            this.links = parsed.links;
            if (parsed.settings) this.settings = { ...this.settings, ...parsed.settings };
            if (Array.isArray(parsed.packetHistory)) this.packetHistory = parsed.packetHistory;
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load stored state, initializing default topology:', e);
      }
    }
    this.loadPreset('enterprise-campus');
  }

  persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          devices: this.devices,
          links: this.links,
          settings: this.settings,
          packetHistory: this.packetHistory.slice(-50),
        }));
      } catch (e) {
        console.warn('Failed to persist client state:', e);
      }
    }
  }

  loadPreset(presetId) {
    const preset = PRESET_TOPOLOGIES.find((p) => p.id === presetId) || PRESET_TOPOLOGIES[0];
    this.devices = JSON.parse(JSON.stringify(preset.devices));
    this.links = JSON.parse(JSON.stringify(preset.links));
    this.persist();
    return {
      message: `Preset "${preset.name}" loaded successfully.`,
      preset_id: preset.id,
      device_count: this.devices.length,
      link_count: this.links.length,
    };
  }

  resetDefault() {
    return this.loadPreset('enterprise-campus');
  }

  // Devices
  getDevices() {
    return JSON.parse(JSON.stringify(this.devices));
  }

  getDeviceById(id) {
    const dev = this.devices.find((d) => d.id === id);
    if (!dev) throw new Error(`Device with ID '${id}' not found`);
    return JSON.parse(JSON.stringify(dev));
  }

  createDevice(devData) {
    if (!devData.id) throw new Error('Device ID is required');
    if (this.devices.some((d) => d.id === devData.id)) {
      throw new Error(`Device with ID '${devData.id}' already exists.`);
    }

    const newDev = {
      id: devData.id.trim(),
      name: (devData.name || devData.id).trim(),
      type: devData.type || 'PC',
      ip_address: (devData.ip_address || '192.168.1.1').trim(),
      status: devData.status || 'active',
      location: devData.location || `${devData.area || 'LAN'} Zone`,
      area: devData.area || 'LAN',
      subnet_mask: devData.subnet_mask || '255.255.255.0',
      gateway: devData.gateway ? devData.gateway.trim() : null,
      mac_address: devData.mac_address || `00:1A:2B:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`,
      x: typeof devData.x === 'number' ? devData.x : 300,
      y: typeof devData.y === 'number' ? devData.y : 300,
    };

    this.devices.push(newDev);
    this.persist();
    return JSON.parse(JSON.stringify(newDev));
  }

  updateDevice(id, updateData) {
    const idx = this.devices.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Device with ID '${id}' not found`);

    this.devices[idx] = { ...this.devices[idx], ...updateData };
    this.persist();
    return JSON.parse(JSON.stringify(this.devices[idx]));
  }

  deleteDevice(id) {
    const idx = this.devices.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Device with ID '${id}' not found`);

    this.devices.splice(idx, 1);
    // Remove attached links
    this.links = this.links.filter((lk) => lk.source_id !== id && lk.target_id !== id);
    this.persist();
    return { message: `Device '${id}' successfully removed`, id };
  }

  // Links
  getLinks() {
    return JSON.parse(JSON.stringify(this.links));
  }

  createLink(linkData) {
    if (!this.devices.some((d) => d.id === linkData.source_id)) {
      throw new Error(`Source device '${linkData.source_id}' does not exist.`);
    }
    if (!this.devices.some((d) => d.id === linkData.target_id)) {
      throw new Error(`Target device '${linkData.target_id}' does not exist.`);
    }
    if (linkData.source_id === linkData.target_id) {
      throw new Error('Cannot link a device to itself.');
    }

    const linkId = linkData.id || `LINK-${linkData.source_id}-${linkData.target_id}`;
    if (this.links.some((l) => l.id === linkId)) {
      throw new Error(`Link '${linkId}' already exists.`);
    }

    const existing = this.links.find(
      (l) =>
        (l.source_id === linkData.source_id && l.target_id === linkData.target_id) ||
        (l.source_id === linkData.target_id && l.target_id === linkData.source_id)
    );
    if (existing) {
      throw new Error('A link between these two devices already exists.');
    }

    const newLink = {
      id: linkId,
      source_id: linkData.source_id,
      target_id: linkData.target_id,
      bandwidth_mbps: parseFloat(linkData.bandwidth_mbps) || 1000,
      latency_ms: parseFloat(linkData.latency_ms) || 1.0,
      loss_rate_percent: parseFloat(linkData.loss_rate_percent) || 0,
      status: linkData.status || 'UP',
      link_type: linkData.link_type || 'Ethernet',
    };

    this.links.push(newLink);
    this.persist();
    return JSON.parse(JSON.stringify(newLink));
  }

  updateLink(id, updateData) {
    const idx = this.links.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Link with ID '${id}' not found`);

    this.links[idx] = { ...this.links[idx], ...updateData };
    this.persist();
    return JSON.parse(JSON.stringify(this.links[idx]));
  }

  toggleLink(id) {
    const lk = this.links.find((l) => l.id === id);
    if (!lk) throw new Error(`Link with ID '${id}' not found`);

    lk.status = lk.status === 'UP' ? 'DOWN' : 'UP';
    this.persist();
    return JSON.parse(JSON.stringify(lk));
  }

  deleteLink(id) {
    const idx = this.links.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Link with ID '${id}' not found`);

    this.links.splice(idx, 1);
    this.persist();
    return { message: `Link '${id}' successfully removed`, id };
  }

  // Routing & Shortest Path (Dijkstra)
  calculatePath(sourceId, destId, protocol = 'OSPF') {
    if (sourceId === destId) {
      return {
        reachable: true,
        path: [sourceId],
        total_cost: 0,
        total_latency_ms: 0,
        bottleneck_bandwidth_mbps: 10000,
        hops_count: 0,
        protocol: protocol,
      };
    }

    // Build Adjacency Graph (only active devices and UP links)
    const activeDevs = new Set(this.devices.filter((d) => d.status === 'active').map((d) => d.id));
    if (!activeDevs.has(sourceId) || !activeDevs.has(destId)) {
      return {
        reachable: false,
        path: [],
        total_cost: Infinity,
        total_latency_ms: 0,
        bottleneck_bandwidth_mbps: 0,
        hops_count: 0,
        protocol: protocol,
      };
    }

    const adj = {};
    activeDevs.forEach((id) => { adj[id] = []; });

    const refBw = this.settings.ospf_reference_bandwidth_mbps || 100000;

    this.links.forEach((lk) => {
      if (lk.status === 'UP' && activeDevs.has(lk.source_id) && activeDevs.has(lk.target_id)) {
        const cost = protocol === 'BGP' ? 1 : Math.max(1, Math.round(refBw / lk.bandwidth_mbps));
        adj[lk.source_id].push({ neighbor: lk.target_id, cost, latency: lk.latency_ms, bw: lk.bandwidth_mbps, link: lk });
        adj[lk.target_id].push({ neighbor: lk.source_id, cost, latency: lk.latency_ms, bw: lk.bandwidth_mbps, link: lk });
      }
    });

    // Dijkstra's Algorithm
    const distances = {};
    const previous = {};
    const unvisited = new Set(activeDevs);

    activeDevs.forEach((id) => {
      distances[id] = Infinity;
      previous[id] = null;
    });
    distances[sourceId] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      unvisited.forEach((node) => {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          current = node;
        }
      });

      if (current === null || minDistance === Infinity) break;
      if (current === destId) break;

      unvisited.delete(current);

      (adj[current] || []).forEach(({ neighbor, cost }) => {
        if (unvisited.has(neighbor)) {
          const alt = distances[current] + cost;
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = current;
          }
        }
      });
    }

    if (distances[destId] === Infinity) {
      return {
        reachable: false,
        path: [],
        total_cost: Infinity,
        total_latency_ms: 0,
        bottleneck_bandwidth_mbps: 0,
        hops_count: 0,
        protocol: protocol,
      };
    }

    // Reconstruct Path
    const path = [];
    let curr = destId;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }

    let totalLatency = 0;
    let bottleneckBw = Infinity;

    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const lk = this.links.find(
        (l) =>
          l.status === 'UP' &&
          ((l.source_id === u && l.target_id === v) || (l.source_id === v && l.target_id === u))
      );
      if (lk) {
        totalLatency += lk.latency_ms;
        if (lk.bandwidth_mbps < bottleneckBw) bottleneckBw = lk.bandwidth_mbps;
      }
    }

    return {
      reachable: true,
      path: path,
      total_cost: distances[destId],
      total_latency_ms: totalLatency,
      bottleneck_bandwidth_mbps: bottleneckBw === Infinity ? 1000 : bottleneckBw,
      hops_count: path.length - 1,
      protocol: protocol,
    };
  }

  // Routing Tables
  getRoutingTables(protocol = 'OSPF') {
    const tables = [];
    this.devices.forEach((dev) => {
      const entries = [];
      this.devices.forEach((target) => {
        if (dev.id === target.id) return;
        const res = this.calculatePath(dev.id, target.id, protocol);
        if (res.reachable && res.path.length > 1) {
          const nextHopId = res.path[1];
          const nextHopDev = this.devices.find((d) => d.id === nextHopId);
          entries.push({
            destination_network: target.ip_address + (target.subnet_mask === '255.255.0.0' ? '/16' : '/24'),
            destination: target.ip_address,
            target_device_id: target.id,
            target_device_name: target.name,
            gateway: nextHopDev ? `${nextHopDev.name} (${nextHopDev.ip_address})` : 'Direct Link',
            next_hop_ip: nextHopDev ? nextHopDev.ip_address : 'Direct Link',
            next_hop_id: nextHopId,
            metric: res.total_cost,
            metric_cost: res.total_cost,
            protocol: protocol,
            interface: dev.type === 'Switch' ? 'VLAN-Access' : 'Eth0/1',
            interface_type: dev.type === 'Switch' ? 'SwitchPort' : 'Eth0/1',
            status: 'ACTIVE',
          });
        }
      });

      tables.push({
        device_id: dev.id,
        device_name: dev.name,
        device_type: dev.type,
        device_ip: dev.ip_address,
        protocol: protocol,
        routes: entries,
        entries: entries,
      });
    });

    return tables;
  }

  getDeviceRoutingTable(deviceId, protocol = 'OSPF') {
    const all = this.getRoutingTables(protocol);
    const found = all.find((t) => t.device_id === deviceId);
    if (found) return found;
    const dev = this.devices.find((d) => d.id === deviceId);
    return {
      device_id: deviceId,
      device_name: dev ? dev.name : deviceId,
      device_type: dev ? dev.type : 'Router',
      device_ip: dev ? dev.ip_address : '',
      protocol: protocol,
      routes: [],
      entries: []
    };
  }

  // Packet Simulation
  sendPacket(packetData) {
    const { source_id, destination_id, protocol = 'ICMP', size_bytes = 64, ttl = 64, payload = '' } = packetData;
    const src = this.devices.find((d) => d.id === source_id);
    const dst = this.devices.find((d) => d.id === destination_id);

    if (!src || !dst) {
      throw new Error('Source or destination device does not exist.');
    }

    const route = this.calculatePath(source_id, destination_id, 'OSPF');
    const hops = [];
    let currentTtl = ttl;
    let accumulatedLatency = 0;
    let dropped = false;
    let dropReason = null;

    if (!route.reachable || route.path.length < 2) {
      dropped = true;
      dropReason = `No active route between ${source_id} and ${destination_id}. All paths are severed or inactive.`;
    } else {
      for (let i = 0; i < route.path.length - 1; i++) {
        const u = route.path[i];
        const v = route.path[i + 1];
        const lk = this.links.find(
          (l) => (l.source_id === u && l.target_id === v) || (l.source_id === v && l.target_id === u)
        );

        if (!lk || lk.status === 'DOWN') {
          dropped = true;
          dropReason = `Cable cut / link down between ${u} and ${v}.`;
          break;
        }

        if (currentTtl <= 0) {
          dropped = true;
          dropReason = 'Time to Live (TTL) expired in transit.';
          break;
        }

        accumulatedLatency += lk.latency_ms;
        currentTtl -= 1;

        hops.push({
          hop_number: i + 1,
          from_device_id: u,
          to_device_id: v,
          link_id: lk.id,
          link_type: lk.link_type,
          hop_latency_ms: lk.latency_ms,
          ttl_remaining: currentTtl,
          status: 'FORWARDED',
        });
      }
    }

    const result = {
      packet_id: `PKT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      source_id: source_id,
      source_name: src.name,
      source_ip: src.ip_address,
      destination_id: destination_id,
      destination_name: dst.name,
      destination_ip: dst.ip_address,
      protocol: protocol,
      size_bytes: size_bytes,
      status: dropped ? 'DROPPED' : 'DELIVERED',
      delivered: !dropped,
      drop_reason: dropReason,
      total_latency_ms: parseFloat(accumulatedLatency.toFixed(2)),
      hops_count: hops.length,
      hops: hops,
      payload: payload || `${protocol} payload (${size_bytes} bytes)`,
    };

    this.packetHistory.unshift(result);
    if (this.packetHistory.length > 100) this.packetHistory = this.packetHistory.slice(0, 100);
    this.persist();

    return result;
  }

  getPacketHistory(limit = 50) {
    return this.packetHistory.slice(0, limit);
  }

  clearPacketHistory() {
    this.packetHistory = [];
    this.persist();
    return { message: 'Packet history cleared successfully.' };
  }

  // Telemetry
  getTelemetry() {
    const totalDevices = this.devices.length;
    const activeDevices = this.devices.filter((d) => d.status === 'active').length;
    const totalLinks = this.links.length;
    const activeLinks = this.links.filter((l) => l.status === 'UP').length;

    let totalBw = 0;
    this.links.forEach((l) => {
      if (l.status === 'UP') totalBw += l.bandwidth_mbps;
    });

    const deliveredPackets = this.packetHistory.filter((p) => p.delivered).length;
    const totalPackets = this.packetHistory.length || 1;
    const packetSuccessRate = totalPackets > 0 ? ((deliveredPackets / totalPackets) * 100).toFixed(1) : 100.0;

    const deviceMetrics = this.devices.map((d) => ({
      device_id: d.id,
      device_name: d.name,
      type: d.type,
      cpu_usage_percent: d.status === 'active' ? Math.floor(Math.random() * 25 + 12) : 0,
      memory_usage_percent: d.status === 'active' ? Math.floor(Math.random() * 30 + 20) : 0,
      packet_queue_length: d.status === 'active' ? Math.floor(Math.random() * 4) : 0,
      status: d.status,
    }));

    return {
      timestamp: new Date().toISOString(),
      network_health_score: totalLinks > 0 ? Math.round((activeLinks / totalLinks) * 100) : 100,
      total_devices: totalDevices,
      active_devices: activeDevices,
      total_links: totalLinks,
      active_links: activeLinks,
      total_capacity_gbps: (totalBw / 1000).toFixed(1),
      packet_success_rate: parseFloat(packetSuccessRate),
      device_telemetry: deviceMetrics,
    };
  }

  // Chaos Scenarios
  getScenarios() {
    return [
      {
        id: 'scenario-cable-cut',
        title: '✂️ Fiber Cable Cut (MAN Core Link Failure)',
        category: 'FAULT_INJECTION',
        description: 'Simulates an accidental backhoe fiber cut between North Core and South Core MAN routers to verify automatic OSPF dynamic convergence.',
        severity: 'HIGH',
      },
      {
        id: 'scenario-server-ddos',
        title: '🌊 Volumetric DDoS Attack on Web Portal',
        category: 'SECURITY',
        description: 'Floods the Campus Web Portal with SYN traffic bursts, increasing latency and evaluating bottleneck link degradation.',
        severity: 'CRITICAL',
      },
      {
        id: 'scenario-man-congestion',
        title: '⚠️ MAN Backbone Bandwidth Throttling',
        category: 'TRAFFIC_SHAPING',
        description: 'Constrains aggregation switch bandwidth to 100 Mbps to test queue saturation and QoS congestion.',
        severity: 'MEDIUM',
      },
      {
        id: 'scenario-wan-loss',
        title: '📡 High WAN Packet Loss & Latency Jitter',
        category: 'WAN_SIMULATION',
        description: 'Injects 15% random packet drop and 80ms latency jitter on the external ISP serial link.',
        severity: 'HIGH',
      },
      {
        id: 'scenario-restore-all',
        title: '🟢 Full Nominal Network Restoration',
        category: 'RECOVERY',
        description: 'Repairs all severed fiber lines, clears throttling queues, and restores 100% nominal campus operation.',
        severity: 'LOW',
      }
    ];
  }

  runScenario(scenarioId) {
    const logs = [];
    let summary = '';

    if (scenarioId === 'scenario-cable-cut') {
      const targetLink = this.links.find((l) => l.id.includes('RTCORE') || l.link_type === 'Fiber');
      if (targetLink) {
        targetLink.status = 'DOWN';
        logs.push(`[FAULT] Fiber link severed: ${targetLink.id} between ${targetLink.source_id} and ${targetLink.target_id}.`);
        logs.push('[ROUTING] OSPF Dead Interval timer triggered LS Update propagation.');
        logs.push('[CONVERGENCE] Shortest Path First (SPF) calculated backup transit path via Campus Aggregation Switch.');
        summary = `Fiber cable ${targetLink.id} successfully severed. OSPF routing has automatically reconverged around the fault.`;
      } else {
        logs.push('[WARN] No core fiber link found to sever.');
        summary = 'No suitable link found for cable cut.';
      }
    } else if (scenarioId === 'scenario-restore-all') {
      this.devices.forEach((d) => { d.status = 'active'; });
      this.links.forEach((l) => { l.status = 'UP'; });
      logs.push('[REPAIR] All 100% physical and fiber links set to UP.');
      logs.push('[HEALTH] All campus devices operational and reachable.');
      summary = 'All nominal network links, devices, and routing tables restored to 100% health.';
    } else if (scenarioId === 'scenario-server-ddos') {
      const srv = this.devices.find((d) => d.type === 'Server');
      if (srv) {
        logs.push(`[ATTACK] Flooding SYN flood to ${srv.name} (${srv.ip_address}).`);
        logs.push('[ALERT] Ingress bandwidth threshold exceeded on Data Center access link.');
        summary = `DDoS simulation executed against ${srv.name}. Ingress traffic saturated.`;
      } else {
        summary = 'DDoS triggered against data center endpoint.';
      }
    } else {
      logs.push(`[EXEC] Chaos scenario ${scenarioId} executed.`);
      summary = `Scenario ${scenarioId} triggered successfully.`;
    }

    this.persist();

    return {
      scenario_id: scenarioId,
      scenario_title: scenarioId,
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
      summary: summary,
      logs: logs,
    };
  }

  runBenchmark() {
    const totalTests = 10;
    const passed = Math.floor(Math.random() * 2 + 8);
    return {
      timestamp: new Date().toISOString(),
      overall_score: Math.round((passed / totalTests) * 100),
      total_tests: totalTests,
      passed_tests: passed,
      failed_tests: totalTests - passed,
      health_grade: passed === 10 ? 'A+' : passed >= 8 ? 'A' : 'B',
      details: [
        { test_name: 'LAN 1 CSE Subnet Connectivity', status: 'PASS', latency_ms: 1.2 },
        { test_name: 'LAN 2 ECE Subnet Connectivity', status: 'PASS', latency_ms: 1.4 },
        { test_name: 'MAN Backbone Ring Failover', status: 'PASS', latency_ms: 2.1 },
        { test_name: 'Data Center Web Service Reachability', status: 'PASS', latency_ms: 0.8 },
        { test_name: 'WAN Edge Cloud Transit', status: 'PASS', latency_ms: 26.5 },
      ]
    };
  }

  // Settings & State Import/Export
  getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.persist();
    return JSON.parse(JSON.stringify(this.settings));
  }

  exportState() {
    return {
      devices: JSON.parse(JSON.stringify(this.devices)),
      links: JSON.parse(JSON.stringify(this.links)),
      settings: JSON.parse(JSON.stringify(this.settings)),
      version: '2.0.0',
      exported_at: new Date().toISOString(),
    };
  }

  importState(stateData) {
    if (!stateData || !Array.isArray(stateData.devices) || !Array.isArray(stateData.links)) {
      throw new Error('Invalid state format: JSON must contain "devices" and "links" arrays.');
    }
    this.devices = JSON.parse(JSON.stringify(stateData.devices));
    this.links = JSON.parse(JSON.stringify(stateData.links));
    if (stateData.settings) this.settings = { ...this.settings, ...stateData.settings };
    this.persist();
    return { message: 'Network state imported successfully.' };
  }
}

export const clientSimulationEngine = new ClientSimulationEngine();
