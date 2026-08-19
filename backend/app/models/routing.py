from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class RoutingProtocol(str, Enum):
    OSPF = "OSPF"
    RIP = "RIP"
    STATIC = "STATIC"


class RouteEntry(BaseModel):
    destination_network: str = Field(..., description="Destination CIDR / Network or IP")
    gateway: str = Field(..., description="Next hop Gateway IP address")
    interface: str = Field(..., description="Egress Interface / Port name")
    metric: float = Field(..., description="Route metric (OSPF Cost or RIP Hop count)")
    protocol: RoutingProtocol = Field(..., description="Routing protocol origin")
    status: str = Field(default="ACTIVE", description="Route operational state")


class RoutingTableResponse(BaseModel):
    device_id: str
    device_name: str
    device_ip: str
    device_type: str
    area: str
    protocol: RoutingProtocol
    routes: List[RouteEntry]


class ShortestPathRequest(BaseModel):
    source_id: str
    destination_id: str
    protocol: RoutingProtocol = RoutingProtocol.OSPF


class ShortestPathResponse(BaseModel):
    source_id: str
    destination_id: str
    protocol: RoutingProtocol
    reachable: bool
    path: List[str]  # List of device IDs along path
    total_cost_or_hops: float
    hop_count: int
    estimated_latency_ms: float
    bottleneck_bandwidth_mbps: float
    nodes_details: List[Dict[str, Any]]
    explanation: str
