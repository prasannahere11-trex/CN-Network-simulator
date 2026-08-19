from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class LinkStatus(str, Enum):
    UP = "UP"
    DOWN = "DOWN"


class LinkType(str, Enum):
    ETHERNET = "Ethernet"
    FIBER = "Fiber"
    SERIAL = "Serial/WAN"


class LinkBase(BaseModel):
    source_id: str = Field(..., description="Source device ID")
    target_id: str = Field(..., description="Target device ID")
    bandwidth_mbps: float = Field(default=1000.0, description="Link bandwidth in Mbps")
    latency_ms: float = Field(default=2.0, description="Propagation + base transmission latency in ms")
    loss_rate_percent: float = Field(default=0.0, description="Packet loss probability (0-100%)")
    status: LinkStatus = Field(default=LinkStatus.UP, description="Current link operational state")
    link_type: LinkType = Field(default=LinkType.ETHERNET, description="Physical medium type")


class LinkCreate(LinkBase):
    id: Optional[str] = Field(default=None, description="Optional custom Link ID (generated if omitted)")


class LinkUpdate(BaseModel):
    bandwidth_mbps: Optional[float] = None
    latency_ms: Optional[float] = None
    loss_rate_percent: Optional[float] = None
    status: Optional[LinkStatus] = None
    link_type: Optional[LinkType] = None


class LinkResponse(LinkBase):
    id: str = Field(..., description="Unique link identifier (e.g. LINK-SW001-RT001)")

    class Config:
        use_enum_values = True
