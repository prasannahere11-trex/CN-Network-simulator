import heapq
from typing import Dict, List, Tuple, Optional, Any
from app.models.device import DeviceResponse, DeviceType, DeviceStatus
from app.models.link import LinkResponse, LinkStatus
from app.models.routing import (
    RoutingProtocol, RouteEntry, RoutingTableResponse,
    ShortestPathResponse
)
from app.services.device_service import device_service


class RoutingEngine:
    def __init__(self):
        pass

    def _build_graph(self, protocol: RoutingProtocol = RoutingProtocol.OSPF) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, DeviceResponse]]:
        devices = {d.id: d for d in device_service.get_all_devices()}
        links = device_service.get_all_links()
        settings = device_service.get_settings()
        ref_bw = settings.ospf_reference_bandwidth_mbps

        adj: Dict[str, List[Dict[str, Any]]] = {dev_id: [] for dev_id in devices}

        for link in links:
            # Only consider UP links and active devices
            if link.status != LinkStatus.UP:
                continue
            src = link.source_id
            dst = link.target_id
            if src not in devices or dst not in devices:
                continue
            if devices[src].status != DeviceStatus.ACTIVE or devices[dst].status != DeviceStatus.ACTIVE:
                continue

            if protocol == RoutingProtocol.OSPF:
                # OSPF Cost = Reference_BW / Link_BW (minimum cost 1)
                cost = max(1.0, ref_bw / max(link.bandwidth_mbps, 0.1))
            elif protocol == RoutingProtocol.RIP:
                # RIP metric = 1 hop per link
                cost = 1.0
            else:  # STATIC
                cost = max(1.0, link.latency_ms)

            adj[src].append({
                "neighbor_id": dst,
                "link_id": link.id,
                "cost": cost,
                "latency_ms": link.latency_ms,
                "bandwidth_mbps": link.bandwidth_mbps,
                "loss_rate": link.loss_rate_percent,
                "type": link.link_type
            })
            adj[dst].append({
                "neighbor_id": src,
                "link_id": link.id,
                "cost": cost,
                "latency_ms": link.latency_ms,
                "bandwidth_mbps": link.bandwidth_mbps,
                "loss_rate": link.loss_rate_percent,
                "type": link.link_type
            })

        return adj, devices

    def calculate_shortest_path(
        self,
        source_id: str,
        destination_id: str,
        protocol: RoutingProtocol = RoutingProtocol.OSPF
    ) -> ShortestPathResponse:
        adj, devices = self._build_graph(protocol)

        if source_id not in devices:
            return self._unreachable_response(source_id, destination_id, protocol, f"Source device '{source_id}' does not exist.")
        if destination_id not in devices:
            return self._unreachable_response(source_id, destination_id, protocol, f"Destination device '{destination_id}' does not exist.")
        if devices[source_id].status != DeviceStatus.ACTIVE:
            return self._unreachable_response(source_id, destination_id, protocol, f"Source device '{source_id}' is {devices[source_id].status.upper()}.")
        if devices[destination_id].status != DeviceStatus.ACTIVE:
            return self._unreachable_response(source_id, destination_id, protocol, f"Destination device '{destination_id}' is {devices[destination_id].status.upper()}.")

        if source_id == destination_id:
            return ShortestPathResponse(
                source_id=source_id,
                destination_id=destination_id,
                protocol=protocol,
                reachable=True,
                path=[source_id],
                total_cost_or_hops=0.0,
                hop_count=0,
                estimated_latency_ms=0.0,
                bottleneck_bandwidth_mbps=10000.0,
                nodes_details=[devices[source_id].dict()],
                explanation="Source and destination are the same device (Loopback)."
            )

        # Dijkstra Algorithm
        distances = {node: float("inf") for node in devices}
        distances[source_id] = 0.0
        previous_nodes: Dict[str, Optional[str]] = {node: None for node in devices}
        link_used: Dict[str, Optional[Dict[str, Any]]] = {node: None for node in devices}
        pq = [(0.0, source_id)]

        while pq:
            curr_dist, curr_node = heapq.heappop(pq)
            if curr_dist > distances[curr_node]:
                continue
            if curr_node == destination_id:
                break

            for edge in adj.get(curr_node, []):
                neighbor = edge["neighbor_id"]
                weight = edge["cost"]
                new_dist = curr_dist + weight

                # RIP max 15 hops limit
                if protocol == RoutingProtocol.RIP and new_dist > 15:
                    continue

                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous_nodes[neighbor] = curr_node
                    link_used[neighbor] = edge
                    heapq.heappush(pq, (new_dist, neighbor))

        if distances[destination_id] == float("inf"):
            return self._unreachable_response(
                source_id, destination_id, protocol,
                f"No active network route exists between {source_id} ({devices[source_id].name}) and {destination_id} ({devices[destination_id].name}). Check if connecting links or intermediary gateways are DOWN."
            )

        # Reconstruct path
        path = []
        curr = destination_id
        while curr is not None:
            path.append(curr)
            curr = previous_nodes[curr]
        path.reverse()

        # Compute bottleneck bandwidth and cumulative latency
        total_latency = 0.0
        min_bw = float("inf")
        nodes_details = [devices[node_id].dict() for node_id in path]

        for i in range(len(path) - 1):
            n1 = path[i]
            n2 = path[i + 1]
            # find link between n1 and n2
            for edge in adj.get(n1, []):
                if edge["neighbor_id"] == n2:
                    total_latency += edge["latency_ms"]
                    min_bw = min(min_bw, edge["bandwidth_mbps"])
                    break

        if min_bw == float("inf"):
            min_bw = 1000.0

        if protocol == RoutingProtocol.OSPF:
            explanation = (
                f"OSPF SPF (Dijkstra) computed lowest cost path across {len(path)-1} hops. "
                f"Total OSPF Metric Cost: {distances[destination_id]:.1f}, "
                f"Bottleneck Bandwidth: {min_bw} Mbps, "
                f"Est. Latency: {total_latency:.2f} ms."
            )
        elif protocol == RoutingProtocol.RIP:
            explanation = (
                f"RIP (Distance-Vector Bellman-Ford) selected path with minimal hop count: {int(distances[destination_id])} hops. "
                f"Bottleneck Bandwidth: {min_bw} Mbps, "
                f"Est. Latency: {total_latency:.2f} ms."
            )
        else:
            explanation = f"Static route resolved across {len(path)-1} hops with estimated latency of {total_latency:.2f} ms."

        return ShortestPathResponse(
            source_id=source_id,
            destination_id=destination_id,
            protocol=protocol,
            reachable=True,
            path=path,
            total_cost_or_hops=round(distances[destination_id], 2),
            hop_count=len(path) - 1,
            estimated_latency_ms=round(total_latency, 2),
            bottleneck_bandwidth_mbps=min_bw,
            nodes_details=nodes_details,
            explanation=explanation
        )

    def _unreachable_response(
        self,
        source_id: str,
        destination_id: str,
        protocol: RoutingProtocol,
        reason: str
    ) -> ShortestPathResponse:
        return ShortestPathResponse(
            source_id=source_id,
            destination_id=destination_id,
            protocol=protocol,
            reachable=False,
            path=[],
            total_cost_or_hops=float("inf"),
            hop_count=0,
            estimated_latency_ms=0.0,
            bottleneck_bandwidth_mbps=0.0,
            nodes_details=[],
            explanation=reason
        )

    def get_routing_table_for_device(
        self,
        device_id: str,
        protocol: RoutingProtocol = RoutingProtocol.OSPF
    ) -> RoutingTableResponse:
        dev = device_service.get_device_by_id(device_id)
        if not dev:
            raise ValueError(f"Device '{device_id}' not found.")

        all_devices = device_service.get_all_devices()
        routes: List[RouteEntry] = []

        # 1. Directly Connected Subnet / Local Interface
        routes.append(RouteEntry(
            destination_network=f"{dev.ip_address}/32",
            gateway="0.0.0.0 (Local Loopback)",
            interface="lo0",
            metric=0.0,
            protocol=RoutingProtocol.STATIC,
            status="UP"
        ))

        if dev.gateway and dev.type in [DeviceType.PC, DeviceType.SERVER]:
            # Host default gateway
            routes.append(RouteEntry(
                destination_network="0.0.0.0/0 (Default Gateway)",
                gateway=dev.gateway,
                interface="eth0",
                metric=1.0,
                protocol=RoutingProtocol.STATIC,
                status="ACTIVE"
            ))

        # Dynamic routes to all other subnets/destinations
        seen_destinations = set()
        for target in all_devices:
            if target.id == device_id or target.ip_address == dev.ip_address:
                continue

            # Compute route from device to target
            res = self.calculate_shortest_path(device_id, target.id, protocol)
            if res.reachable and len(res.path) >= 2:
                next_hop_node = device_service.get_device_by_id(res.path[1])
                if not next_hop_node:
                    continue
                
                dest_cidr = f"{target.ip_address}/32 ({target.name})"
                if dest_cidr not in seen_destinations:
                    seen_destinations.add(dest_cidr)
                    interface_name = f"eth{min(len(routes), 4)}" if dev.type == DeviceType.ROUTER else "vlan1"
                    routes.append(RouteEntry(
                        destination_network=dest_cidr,
                        gateway=next_hop_node.ip_address,
                        interface=interface_name,
                        metric=res.total_cost_or_hops,
                        protocol=protocol,
                        status="ACTIVE"
                    ))

        return RoutingTableResponse(
            device_id=dev.id,
            device_name=dev.name,
            device_ip=dev.ip_address,
            device_type=dev.type,
            area=dev.area,
            protocol=protocol,
            routes=routes
        )


# Singleton
routing_engine = RoutingEngine()
