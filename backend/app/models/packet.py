from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ProtocolType(str, Enum):
    ICMP = "ICMP"
    TCP = "TCP"
    UDP = "UDP"
    HTTP = "HTTP"
    DNS = "DNS"


class PacketHeaderDissection(BaseModel):
    layer2_ethernet: Dict[str, Any] = Field(..., description="Layer 2 Ethernet Frame Headers (MAC)")
    layer3_ip: Dict[str, Any] = Field(..., description="Layer 3 IPv4 Header (Src IP, Dst IP, TTL, Checksum)")
    layer4_transport: Dict[str, Any] = Field(..., description="Layer 4 Transport Header (Ports, Flags, Seq/Ack)")
    layer7_payload: Dict[str, Any] = Field(..., description="Layer 7 Application Data / Payload")


class PacketHop(BaseModel):
    hop_number: int
    from_device_id: str
    from_device_name: str
    to_device_id: str
    to_device_name: str
    link_id: Optional[str] = None
    link_status: str = "UP"
    link_bandwidth_mbps: float = 1000.0
    link_latency_ms: float = 2.0
    queue_delay_ms: float = 0.0
    ttl_remaining: int = 64
    action: str = "FORWARDED"  # FORWARDED, ROUTED, SWITCHED, DROPPED, DELIVERED
    description: str = ""


class PacketSendRequest(BaseModel):
    source_id: str = Field(..., description="Source device ID (e.g. PC-001)")
    destination_id: str = Field(..., description="Destination device ID (e.g. SRV-001)")
    protocol: ProtocolType = Field(default=ProtocolType.ICMP, description="Network / Transport protocol")
    size_bytes: int = Field(default=64, description="Packet size in bytes")
    ttl: int = Field(default=64, description="Initial Time-To-Live")
    payload: Optional[str] = Field(default="PING Test Echo Payload", description="Application payload string")
    port: Optional[int] = Field(default=80, description="Destination port (e.g. 80 for HTTP, 53 for DNS)")


class PacketSimulationResult(BaseModel):
    id: str
    timestamp: str
    source_id: str
    source_ip: str
    source_name: str
    destination_id: str
    destination_ip: str
    destination_name: str
    protocol: ProtocolType
    size_bytes: int
    ttl: int
    status: str  # SUCCESS, DROPPED, HOST_UNREACHABLE, TTL_EXPIRED, LINK_DOWN
    total_latency_ms: float
    hops: List[PacketHop]
    headers: PacketHeaderDissection
    details: str
