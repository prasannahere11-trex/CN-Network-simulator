# Multi-Area Campus Network Simulator Using LAN, MAN, and WAN

A full-stack network simulation platform built as a college Computer Networks project demonstrating multi-area network architectures, dynamic routing convergence (OSPF & RIP), multi-hop packet transmission with deep header dissection, link failure chaos engineering, and real-time performance telemetry.

---

## 🌟 Key Features

- **Interactive Network Topology Canvas**: Drag-and-drop SVG workspace with visual subnet zones (**LAN 1** CSE Dept, **LAN 2** ECE Dept, **MAN** 10G Core Ring, **Data Center**, and **WAN** Cloud Edge), interactive link creation, cable-cutting simulation (`UP`/`DOWN`), and live packet animation pulses.
- **Dynamic Routing Protocols**:
  - **OSPF (Open Shortest Path First)**: Dijkstra SPF shortest-path solver with bandwidth-weighted metric costs ($Cost = \text{RefBW} / \text{LinkBW}$).
  - **RIP (Routing Information Protocol)**: Distance-vector Bellman-Ford hop-count metric ($\le 15$ hops).
  - **Static Routing & Default Gateways**: Host-to-gateway routing and dynamic Forwarding Information Base (FIB) generation.
- **Packet Generator & Transmission Simulator**:
  - Protocols: **ICMP (Ping)**, **TCP (3-Way Handshake + Data)**, **UDP**, **HTTP GET / 200 OK**, and **DNS Query**.
  - Delay modeling: Propagation latency, transmission serialization delay, queueing delay, and TTL countdown.
  - Deep Packet Dissection: **Layer 2** Ethernet MAC frames $\to$ **Layer 3** IPv4 header $\to$ **Layer 4** TCP/UDP header $\to$ **Layer 7** Application payload.
- **Real-Time Monitoring & Telemetry**: Live throughput bandwidth gauges, packet delivery/loss metrics, and link utilization heatmap.
- **Chaos Engineering & Scenarios**: One-click fault injection (Fiber Cable Cut, Web Server DDoS, North Core Congestion, WAN Loss) and an automated **Full Campus Network Diagnostic Benchmark Suite** (health scorecards).
- **Configuration Management**: Simulation speed tuning, global loss rate injection, JSON topology export/import, and factory reset.

---

## 📁 Repository Structure

```
campus-network-simulator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddDeviceModal.jsx
│   │   │   ├── AddLinkModal.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── PacketInspectorModal.jsx
│   │   │   ├── PingModal.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── data/
│   │   │   └── constants.js
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DevicesPage.jsx
│   │   │   ├── MonitoringPage.jsx
│   │   │   ├── PacketSimulatorPage.jsx
│   │   │   ├── RoutingPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── SimulationPage.jsx
│   │   │   └── TopologyPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── deviceService.js
│   │   │   └── simulationService.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── device.py
│   │   │   ├── link.py
│   │   │   ├── packet.py
│   │   │   ├── routing.py
│   │   │   └── simulation.py
│   │   ├── routes/
│   │   │   ├── devices.py
│   │   │   ├── health.py
│   │   │   ├── links.py
│   │   │   ├── monitoring.py
│   │   │   ├── packets.py
│   │   │   ├── routing.py
│   │   │   └── simulation.py
│   │   ├── services/
│   │   │   └── device_service.py
│   │   ├── simulation/
│   │   │   ├── packet_engine.py
│   │   │   ├── routing_engine.py
│   │   │   └── scenario_engine.py
│   │   └── main.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## 🛠️ Quick Installation & Setup

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** and **npm**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/prasannahere11-trex/CN-Network-simulator.git
cd CN-Network-simulator
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
```
*API Documentation (Swagger UI) will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open your browser and navigate to [http://localhost:5173](http://localhost:5173).*

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/devices` | List all campus network devices |
| `POST` | `/api/devices` | Register a new network device |
| `PUT` | `/api/devices/{id}` | Update device coordinates or status |
| `DELETE` | `/api/devices/{id}` | Remove device and attached links |
| `GET` | `/api/links` | List all network link interconnects |
| `POST` | `/api/links` | Establish a new link between two devices |
| `POST` | `/api/links/{id}/toggle` | Cut / restore cable (`UP`/`DOWN`) |
| `POST` | `/api/packets/send` | Simulate packet transmission with L2-L7 trace |
| `GET` | `/api/packets/history` | Retrieve packet simulation history logs |
| `GET` | `/api/routing/tables/{id}` | Get computed FIB routing table for a device |
| `POST` | `/api/routing/path` | Calculate shortest path (OSPF vs RIP) |
| `GET` | `/api/monitoring/telemetry` | Real-time network throughput and link heatmap |
| `GET` | `/api/simulation/scenarios` | List chaos engineering scenarios |
| `POST` | `/api/simulation/scenarios/{id}/run` | Execute chaos fault injection |
| `POST` | `/api/simulation/benchmark` | Run full automated campus test suite |
| `GET` | `/api/simulation/settings` | Get global simulation parameters |
| `POST` | `/api/simulation/reset` | Factory reset to default campus topology |
| `GET` | `/api/simulation/export` | Export topology as JSON |
| `POST` | `/api/simulation/import` | Import topology from JSON |

---

## 🎓 Academic Relevance

This project is tailored for Computer Networks coursework covering:
1. **Network Topologies & Tiers**: Departmental LANs, High-Speed Optical MAN Ring, and Serial WAN Border Gateways.
2. **Routing Algorithms**: Link-State Shortest Path First (OSPF / Dijkstra) and Distance-Vector (RIP / Bellman-Ford).
3. **OSI & TCP/IP Layering**: Packet encapsulation, framing, IPv4 routing, TCP handshakes, ICMP diagnostics, and Layer 7 protocols (HTTP & DNS).
4. **Network Reliability & Chaos Engineering**: Link failover convergence and congestion mitigation.
