import time
import random
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.models.device import DeviceResponse, DeviceType, DeviceStatus
from app.models.link import LinkStatus
from app.models.packet import (
    ProtocolType, PacketSendRequest, PacketSimulationResult,
    PacketHop, PacketHeaderDissection
)
from app.models.routing import RoutingProtocol
from app.simulation.routing_engine import routing_engine
from app.services.device_service import device_service


class PacketSimulationEngine:
    def __init__(self):
        self._history: List[PacketSimulationResult] = []
        self._max_history = 150

    def send_packet(self, req: PacketSendRequest) -> PacketSimulationResult:
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        sim_id = f"PKT-{str(uuid.uuid4())[:8].upper()}"

        src_dev = device_service.get_device_by_id(req.source_id)
        dst_dev = device_service.get_device_by_id(req.destination_id)

        if not src_dev or not dst_dev:
            raise ValueError("Source or destination device not found.")

        # Compute shortest path via OSPF
        route_res = routing_engine.calculate_shortest_path(
            req.source_id, req.destination_id, RoutingProtocol.OSPF
        )

        settings = device_service.get_settings()
        global_loss = settings.global_loss_rate_percent / 100.0

        headers = self._generate_headers(src_dev, dst_dev, req)

        if not route_res.reachable or len(route_res.path) == 0:
            result = PacketSimulationResult(
                id=sim_id,
                timestamp=timestamp_str,
                source_id=src_dev.id,
                source_ip=src_dev.ip_address,
                source_name=src_dev.name,
                destination_id=dst_dev.id,
                destination_ip=dst_dev.ip_address,
                destination_name=dst_dev.name,
                protocol=req.protocol,
                size_bytes=req.size_bytes,
                ttl=req.ttl,
                status="HOST_UNREACHABLE",
                total_latency_ms=0.0,
                hops=[],
                headers=headers,
                details=f"Packet dropped at source: {route_res.explanation}"
            )
            self._add_to_history(result)
            return result

        hops: List[PacketHop] = []
        current_ttl = req.ttl
        accumulated_latency = 0.0
        packet_status = "SUCCESS"
        fail_reason = ""

        path_nodes = [device_service.get_device_by_id(nid) for nid in route_res.path]
        links = {l.id: l for l in device_service.get_all_links()}

        for i in range(len(path_nodes) - 1):
            n_from = path_nodes[i]
            n_to = path_nodes[i + 1]

            if not n_from or not n_to:
                packet_status = "DROPPED"
                fail_reason = "Intermediate node disappeared."
                break

            # Find connecting link
            connecting_link = None
            for lk in links.values():
                if (lk.source_id == n_from.id and lk.target_id == n_to.id) or \
                   (lk.source_id == n_to.id and lk.target_id == n_from.id):
                    connecting_link = lk
                    break

            link_status = connecting_link.status if connecting_link else LinkStatus.DOWN
            bw_mbps = connecting_link.bandwidth_mbps if connecting_link else 100.0
            base_lat = connecting_link.latency_ms if connecting_link else 10.0
            loss_prob = (connecting_link.loss_rate_percent / 100.0) if connecting_link else 1.0

            # Transmission delay = size_bits / bw_bps * 1000 ms
            tx_delay = (req.size_bytes * 8.0) / (bw_mbps * 1_000_000.0) * 1000.0
            # Queue delay (small jitter: 0.1 - 0.5ms)
            queue_delay = round(random.uniform(0.1, 0.4), 2)
            hop_latency = base_lat + tx_delay + queue_delay
            accumulated_latency += hop_latency

            current_ttl -= 1

            if link_status != LinkStatus.UP:
                hops.append(PacketHop(
                    hop_number=i + 1,
                    from_device_id=n_from.id,
                    from_device_name=n_from.name,
                    to_device_id=n_to.id,
                    to_device_name=n_to.name,
                    link_id=connecting_link.id if connecting_link else "UNKNOWN",
                    link_status="DOWN",
                    link_bandwidth_mbps=bw_mbps,
                    link_latency_ms=round(hop_latency, 2),
                    queue_delay_ms=queue_delay,
                    ttl_remaining=current_ttl,
                    action="DROPPED",
                    description=f"Physical link {connecting_link.id if connecting_link else 'N/A'} is DOWN."
                ))
                packet_status = "LINK_DOWN"
                fail_reason = f"Link '{connecting_link.id if connecting_link else 'N/A'}' is down."
                break

            if current_ttl <= 0:
                hops.append(PacketHop(
                    hop_number=i + 1,
                    from_device_id=n_from.id,
                    from_device_name=n_from.name,
                    to_device_id=n_to.id,
                    to_device_name=n_to.name,
                    link_id=connecting_link.id,
                    link_status="UP",
                    link_bandwidth_mbps=bw_mbps,
                    link_latency_ms=round(hop_latency, 2),
                    queue_delay_ms=queue_delay,
                    ttl_remaining=0,
                    action="DROPPED",
                    description="Time To Live (TTL) expired in transit (ICMP Type 11)."
                ))
                packet_status = "TTL_EXPIRED"
                fail_reason = "Packet TTL reached zero before reaching destination."
                break

            # Check for random packet loss on link or global loss
            combined_loss = loss_prob + global_loss
            if random.random() < combined_loss:
                hops.append(PacketHop(
                    hop_number=i + 1,
                    from_device_id=n_from.id,
                    from_device_name=n_from.name,
                    to_device_id=n_to.id,
                    to_device_name=n_to.name,
                    link_id=connecting_link.id,
                    link_status="UP",
                    link_bandwidth_mbps=bw_mbps,
                    link_latency_ms=round(hop_latency, 2),
                    queue_delay_ms=queue_delay,
                    ttl_remaining=current_ttl,
                    action="DROPPED",
                    description=f"Packet dropped due to buffer congestion / loss on link ({connecting_link.loss_rate_percent}% loss)."
                ))
                packet_status = "DROPPED"
                fail_reason = f"Packet dropped on link {connecting_link.id}."
                break

            # Forwarded successfully
            action_name = "DELIVERED" if (i == len(path_nodes) - 2) else ("ROUTED" if n_to.type == DeviceType.ROUTER else "SWITCHED")
            desc = (
                f"Payload delivered to {n_to.name} ({n_to.ip_address})"
                if action_name == "DELIVERED"
                else f"Forwarded via {n_to.type} interface (Remaining TTL: {current_ttl})"
            )

            hops.append(PacketHop(
                hop_number=i + 1,
                from_device_id=n_from.id,
                from_device_name=n_from.name,
                to_device_id=n_to.id,
                to_device_name=n_to.name,
                link_id=connecting_link.id if connecting_link else None,
                link_status="UP",
                link_bandwidth_mbps=bw_mbps,
                link_latency_ms=round(hop_latency, 2),
                queue_delay_ms=queue_delay,
                ttl_remaining=current_ttl,
                action=action_name,
                description=desc
            ))

        details = (
            f"Successfully transmitted {req.protocol} packet across {len(hops)} hops in {accumulated_latency:.2f} ms."
            if packet_status == "SUCCESS"
            else f"Simulation ended with status {packet_status}: {fail_reason}"
        )

        result = PacketSimulationResult(
            id=sim_id,
            timestamp=timestamp_str,
            source_id=src_dev.id,
            source_ip=src_dev.ip_address,
            source_name=src_dev.name,
            destination_id=dst_dev.id,
            destination_ip=dst_dev.ip_address,
            destination_name=dst_dev.name,
            protocol=req.protocol,
            size_bytes=req.size_bytes,
            ttl=req.ttl,
            status=packet_status,
            total_latency_ms=round(accumulated_latency, 2),
            hops=hops,
            headers=headers,
            details=details
        )

        self._add_to_history(result)
        return result

    def _generate_headers(
        self,
        src: DeviceResponse,
        dst: DeviceResponse,
        req: PacketSendRequest
    ) -> PacketHeaderDissection:
        # Layer 2 Ethernet Frame
        src_mac = src.mac_address or "00:1A:2B:3C:4D:01"
        dst_mac = dst.mac_address or "00:1A:2B:3C:4D:02"
        l2 = {
            "preamble": "10101010 10101011 (SFD)",
            "destination_mac": dst_mac,
            "source_mac": src_mac,
            "ether_type": "0x0800 (IPv4)",
            "frame_check_sequence": "0x4F92A1B8 (CRC-32 Valid)"
        }

        # Layer 3 IPv4 Header
        ip_proto_map = {
            ProtocolType.ICMP: "1 (ICMP)",
            ProtocolType.TCP: "6 (TCP)",
            ProtocolType.UDP: "17 (UDP)",
            ProtocolType.HTTP: "6 (TCP / HTTP)",
            ProtocolType.DNS: "17 (UDP / DNS)"
        }
        l3 = {
            "version": 4,
            "ihl": "20 Bytes",
            "dscp_ecn": "0x00 (Best Effort)",
            "total_length": f"{req.size_bytes} Bytes",
            "identification": f"0x{random.randint(1000, 65535):04X}",
            "flags": "0x02 (Don't Fragment - DF)",
            "fragment_offset": 0,
            "time_to_live": req.ttl,
            "protocol": ip_proto_map.get(req.protocol, "6 (TCP)"),
            "header_checksum": f"0x{random.randint(1000, 65535):04X} (Correct)",
            "source_ip": src.ip_address,
            "destination_ip": dst.ip_address
        }

        # Layer 4 Transport Header
        src_port = random.randint(49152, 65535)
        dst_port = req.port or 80
        if req.protocol == ProtocolType.HTTP:
            dst_port = 80
        elif req.protocol == ProtocolType.DNS:
            dst_port = 53

        if req.protocol in [ProtocolType.TCP, ProtocolType.HTTP]:
            l4 = {
                "protocol": "TCP",
                "source_port": src_port,
                "destination_port": dst_port,
                "sequence_number": random.randint(100000, 999999),
                "acknowledgment_number": random.randint(100000, 999999),
                "data_offset": "20 Bytes",
                "flags": "SYN, ACK, PSH",
                "window_size": 65535,
                "checksum": f"0x{random.randint(1000, 65535):04X}",
                "urgent_pointer": 0
            }
        elif req.protocol in [ProtocolType.UDP, ProtocolType.DNS]:
            l4 = {
                "protocol": "UDP",
                "source_port": src_port,
                "destination_port": dst_port,
                "length": f"{req.size_bytes - 20} Bytes",
                "checksum": f"0x{random.randint(1000, 65535):04X}"
            }
        else:  # ICMP
            l4 = {
                "protocol": "ICMP",
                "type": "8 (Echo Request)",
                "code": 0,
                "checksum": f"0x{random.randint(1000, 65535):04X}",
                "identifier": f"0x{random.randint(100, 9999):04X}",
                "sequence_number": 1
            }

        # Layer 7 Application Payload
        if req.protocol == ProtocolType.HTTP:
            l7 = {
                "application": "HTTP/1.1",
                "request_line": f"GET /index.html HTTP/1.1",
                "headers": {
                    "Host": dst.ip_address,
                    "User-Agent": f"CampusSimulator/1.0 ({src.name})",
                    "Accept": "text/html,application/json",
                    "Connection": "keep-alive"
                },
                "payload_snippet": req.payload or "GET /index.html Campus Web Portal"
            }
        elif req.protocol == ProtocolType.DNS:
            l7 = {
                "application": "DNS (Domain Name System)",
                "transaction_id": f"0x{random.randint(1000, 65535):04X}",
                "flags": "0x0100 (Standard query)",
                "questions": 1,
                "query_name": "portal.campus.internal",
                "query_type": "A (Host Address)",
                "query_class": "IN (Internet)",
                "payload_snippet": "DNS Query: portal.campus.internal -> 172.16.0.50"
            }
        elif req.protocol == ProtocolType.ICMP:
            l7 = {
                "application": "ICMP Ping Utility",
                "data_length": f"{max(0, req.size_bytes - 28)} Bytes",
                "payload_snippet": req.payload or "abcdefghijklmnopqrstuvwabcdefghi"
            }
        else:
            l7 = {
                "application": f"Raw {req.protocol.value} Data Stream",
                "data_length": f"{req.size_bytes} Bytes",
                "payload_snippet": req.payload or "Campus Network Simulator Test Data"
            }

        return PacketHeaderDissection(
            layer2_ethernet=l2,
            layer3_ip=l3,
            layer4_transport=l4,
            layer7_payload=l7
        )

    def get_history(self, limit: int = 50) -> List[PacketSimulationResult]:
        return self._history[:limit]

    def clear_history(self) -> None:
        self._history.clear()

    def _add_to_history(self, result: PacketSimulationResult) -> None:
        self._history.insert(0, result)
        if len(self._history) > self._max_history:
            self._history = self._history[:self._max_history]


# Singleton instance
packet_engine = PacketSimulationEngine()
