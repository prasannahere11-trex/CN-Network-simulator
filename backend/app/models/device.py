from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class DeviceType(str, Enum):
    PC = "PC"
    SWITCH = "Switch"
    ROUTER = "Router"
    SERVER = "Server"


class DeviceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    STANDBY = "standby"


class AreaType(str, Enum):
    LAN = "LAN"
    MAN = "MAN"
    WAN = "WAN"


class DeviceBase(BaseModel):
    name: str = Field(..., description="Human-readable name of the device (e.g. CSE-PC-01)")
    type: DeviceType = Field(..., description="Hardware type of the device")
    ip_address: str = Field(..., description="IPv4 address assigned to the device")
    status: DeviceStatus = Field(default=DeviceStatus.ACTIVE, description="Current operational status")
    location: str = Field(..., description="Physical or logical campus location (e.g. CSE Building)")
    area: AreaType = Field(default=AreaType.LAN, description="Network tier: LAN, MAN, or WAN")
    subnet_mask: str = Field(default="255.255.255.0", description="Subnet mask")
    gateway: Optional[str] = Field(default=None, description="Default gateway IP address")
    mac_address: Optional[str] = Field(default=None, description="Hardware MAC address")
    x: Optional[float] = Field(default=100.0, description="Topology Canvas X position")
    y: Optional[float] = Field(default=100.0, description="Topology Canvas Y position")


class DeviceCreate(DeviceBase):
    id: str = Field(..., description="Unique identifier for the device (e.g. PC-001)")


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[DeviceType] = None
    ip_address: Optional[str] = None
    status: Optional[DeviceStatus] = None
    location: Optional[str] = None
    area: Optional[AreaType] = None
    subnet_mask: Optional[str] = None
    gateway: Optional[str] = None
    mac_address: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None


class DeviceResponse(DeviceBase):
    id: str = Field(..., description="Unique identifier for the device")

    class Config:
        use_enum_values = True
