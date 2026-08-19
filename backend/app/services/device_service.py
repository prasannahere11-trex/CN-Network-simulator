from typing import Dict, List, Optional, Any
from app.models.device import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceType, DeviceStatus, AreaType
from app.models.link import LinkCreate, LinkUpdate, LinkResponse, LinkStatus, LinkType
from app.models.simulation import NetworkSettings


class NetworkStoreService:
    def __init__(self):
        self._devices: Dict[str, DeviceResponse] = {}
        self._links: Dict[str, LinkResponse] = {}
        self._settings: NetworkSettings = NetworkSettings()
        self.reset_to_default_topology()

    def reset_to_default_topology(self) -> None:
        """Seed a rich, complete Multi-Area Campus Network across LAN, MAN, and WAN."""
        self._devices.clear()
        self._links.clear()

        # 1. LAN 1: CSE Department (192.168.10.0/24)
        lan1_devices = [
            DeviceResponse(
                id="PC-001",
                name="CSE-PC-01",
                type=DeviceType.PC,
                ip_address="192.168.10.10",
                status=DeviceStatus.ACTIVE,
                location="CSE Building Lab 1",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="192.168.10.254",
                mac_address="00:1A:2B:3C:4D:01",
                x=120.0,
                y=160.0
            ),
            DeviceResponse(
                id="PC-002",
                name="CSE-PC-02",
                type=DeviceType.PC,
                ip_address="192.168.10.11",
                status=DeviceStatus.ACTIVE,
                location="CSE Building Lab 2",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="192.168.10.254",
                mac_address="00:1A:2B:3C:4D:02",
                x=120.0,
                y=280.0
            ),
            DeviceResponse(
                id="SW-001",
                name="CSE-Switch-Access",
                type=DeviceType.SWITCH,
                ip_address="192.168.10.1",
                status=DeviceStatus.ACTIVE,
                location="CSE Server Room",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="192.168.10.254",
                mac_address="00:1A:2B:3C:4D:10",
                x=270.0,
                y=220.0
            ),
            DeviceResponse(
                id="RT-001",
                name="CSE-Gateway-Router",
                type=DeviceType.ROUTER,
                ip_address="192.168.10.254",
                status=DeviceStatus.ACTIVE,
                location="CSE NOC Rack",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="10.0.1.1",
                mac_address="00:1A:2B:3C:4D:FE",
                x=420.0,
                y=220.0
            ),
        ]

        # 2. LAN 2: ECE Department (192.168.20.0/24)
        lan2_devices = [
            DeviceResponse(
                id="PC-003",
                name="ECE-Workstation-01",
                type=DeviceType.PC,
                ip_address="192.168.20.10",
                status=DeviceStatus.ACTIVE,
                location="ECE Embedded Lab",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="192.168.20.254",
                mac_address="00:1A:2B:3C:4D:03",
                x=120.0,
                y=440.0
            ),
            DeviceResponse(
                id="SW-002",
                name="ECE-Switch-Access",
                type=DeviceType.SWITCH,
                ip_address="192.168.20.1",
                status=DeviceStatus.ACTIVE,
                location="ECE Telemetry Room",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="192.168.20.254",
                mac_address="00:1A:2B:3C:4D:20",
                x=270.0,
                y=440.0
            ),
            DeviceResponse(
                id="RT-002",
                name="ECE-Gateway-Router",
                type=DeviceType.ROUTER,
                ip_address="192.168.20.254",
                status=DeviceStatus.ACTIVE,
                location="ECE Distribution Rack",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="10.0.2.1",
                mac_address="00:1A:2B:3C:4D:EE",
                x=420.0,
                y=440.0
            ),
        ]

        # 3. MAN: Campus Core Inter-Building High-Speed Ring (10.0.0.0/16)
        man_devices = [
            DeviceResponse(
                id="RT-CORE-1",
                name="North-Campus-Core-Router",
                type=DeviceType.ROUTER,
                ip_address="10.0.1.1",
                status=DeviceStatus.ACTIVE,
                location="Central NOC Building Floor 3",
                area=AreaType.MAN,
                subnet_mask="255.255.0.0",
                gateway="10.0.0.2",
                mac_address="00:1A:2B:3C:4D:C1",
                x=590.0,
                y=220.0
            ),
            DeviceResponse(
                id="RT-CORE-2",
                name="South-Campus-Core-Router",
                type=DeviceType.ROUTER,
                ip_address="10.0.2.1",
                status=DeviceStatus.ACTIVE,
                location="South Campus Telecom Hub",
                area=AreaType.MAN,
                subnet_mask="255.255.0.0",
                gateway="10.0.0.2",
                mac_address="00:1A:2B:3C:4D:C2",
                x=590.0,
                y=440.0
            ),
            DeviceResponse(
                id="SW-CORE",
                name="Campus-Aggregation-Switch",
                type=DeviceType.SWITCH,
                ip_address="10.0.0.2",
                status=DeviceStatus.ACTIVE,
                location="Central NOC Mainframe",
                area=AreaType.MAN,
                subnet_mask="255.255.0.0",
                gateway="10.0.1.1",
                mac_address="00:1A:2B:3C:4D:CA",
                x=740.0,
                y=330.0
            ),
        ]

        # 4. Data Center & Servers (172.16.0.0/24)
        server_devices = [
            DeviceResponse(
                id="SW-DC",
                name="DataCenter-Switch",
                type=DeviceType.SWITCH,
                ip_address="172.16.0.1",
                status=DeviceStatus.ACTIVE,
                location="Data Center Rack 01",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="10.0.1.1",
                mac_address="00:1A:2B:3C:4D:DA",
                x=890.0,
                y=160.0
            ),
            DeviceResponse(
                id="SRV-001",
                name="Campus-Web-Portal",
                type=DeviceType.SERVER,
                ip_address="172.16.0.50",
                status=DeviceStatus.ACTIVE,
                location="Data Center Server Blade 1",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="172.16.0.1",
                mac_address="00:1A:2B:3C:4D:50",
                x=1050.0,
                y=120.0
            ),
            DeviceResponse(
                id="SRV-002",
                name="Campus-DNS-Auth",
                type=DeviceType.SERVER,
                ip_address="172.16.0.53",
                status=DeviceStatus.ACTIVE,
                location="Data Center Server Blade 2",
                area=AreaType.LAN,
                subnet_mask="255.255.255.0",
                gateway="172.16.0.1",
                mac_address="00:1A:2B:3C:4D:53",
                x=1050.0,
                y=230.0
            ),
        ]

        # 5. WAN: Cloud / ISP Edge Gateway (203.0.113.0/24)
        wan_devices = [
            DeviceResponse(
                id="RT-WAN",
                name="Campus-Edge-Border-Router",
                type=DeviceType.ROUTER,
                ip_address="203.0.113.1",
                status=DeviceStatus.ACTIVE,
                location="NOC ISP Demarcation",
                area=AreaType.WAN,
                subnet_mask="255.255.255.0",
                gateway="203.0.113.254",
                mac_address="00:1A:2B:3C:4D:EA",
                x=890.0,
                y=440.0
            ),
            DeviceResponse(
                id="SRV-CLOUD",
                name="External-Cloud-Host",
                type=DeviceType.SERVER,
                ip_address="8.8.8.8",
                status=DeviceStatus.ACTIVE,
                location="Public Internet Cloud ISP",
                area=AreaType.WAN,
                subnet_mask="255.255.255.0",
                gateway="203.0.113.1",
                mac_address="00:1A:2B:3C:4D:88",
                x=1050.0,
                y=440.0
            ),
        ]

        all_devices = lan1_devices + lan2_devices + man_devices + server_devices + wan_devices
        for dev in all_devices:
            self._devices[dev.id] = dev

        # Seed realistic Link Interconnects
        seed_links = [
            # LAN 1 Links
            LinkResponse(id="LINK-PC001-SW001", source_id="PC-001", target_id="SW-001", bandwidth_mbps=1000.0, latency_ms=1.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),
            LinkResponse(id="LINK-PC002-SW001", source_id="PC-002", target_id="SW-001", bandwidth_mbps=1000.0, latency_ms=1.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),
            LinkResponse(id="LINK-SW001-RT001", source_id="SW-001", target_id="RT-001", bandwidth_mbps=1000.0, latency_ms=1.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),
            
            # LAN 2 Links
            LinkResponse(id="LINK-PC003-SW002", source_id="PC-003", target_id="SW-002", bandwidth_mbps=1000.0, latency_ms=1.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),
            LinkResponse(id="LINK-SW002-RT002", source_id="SW-002", target_id="RT-002", bandwidth_mbps=1000.0, latency_ms=1.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),

            # LAN Gateways -> MAN Core Routers
            LinkResponse(id="LINK-RT001-RTCORE1", source_id="RT-001", target_id="RT-CORE-1", bandwidth_mbps=10000.0, latency_ms=2.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),
            LinkResponse(id="LINK-RT002-RTCORE2", source_id="RT-002", target_id="RT-CORE-2", bandwidth_mbps=10000.0, latency_ms=2.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),

            # MAN Inter-Campus Ring Backbone
            LinkResponse(id="LINK-RTCORE1-RTCORE2", source_id="RT-CORE-1", target_id="RT-CORE-2", bandwidth_mbps=10000.0, latency_ms=3.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),
            LinkResponse(id="LINK-RTCORE1-SWCORE", source_id="RT-CORE-1", target_id="SW-CORE", bandwidth_mbps=10000.0, latency_ms=1.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),
            LinkResponse(id="LINK-RTCORE2-SWCORE", source_id="RT-CORE-2", target_id="SW-CORE", bandwidth_mbps=10000.0, latency_ms=1.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),

            # MAN Core -> Data Center Switch
            LinkResponse(id="LINK-RTCORE1-SWDC", source_id="RT-CORE-1", target_id="SW-DC", bandwidth_mbps=10000.0, latency_ms=1.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),
            LinkResponse(id="LINK-SWDC-SRV001", source_id="SW-DC", target_id="SRV-001", bandwidth_mbps=1000.0, latency_ms=0.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),
            LinkResponse(id="LINK-SWDC-SRV002", source_id="SW-DC", target_id="SRV-002", bandwidth_mbps=1000.0, latency_ms=0.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.ETHERNET),

            # MAN Core -> WAN Border Router -> External Cloud
            LinkResponse(id="LINK-SWCORE-RTWAN", source_id="SW-CORE", target_id="RT-WAN", bandwidth_mbps=5000.0, latency_ms=4.0, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),
            LinkResponse(id="LINK-RTCORE2-RTWAN", source_id="RT-CORE-2", target_id="RT-WAN", bandwidth_mbps=5000.0, latency_ms=4.5, loss_rate_percent=0.0, status=LinkStatus.UP, link_type=LinkType.FIBER),
            LinkResponse(id="LINK-RTWAN-SRVCLOUD", source_id="RT-WAN", target_id="SRV-CLOUD", bandwidth_mbps=500.0, latency_ms=25.0, loss_rate_percent=0.5, status=LinkStatus.UP, link_type=LinkType.SERIAL),
        ]
        for lk in seed_links:
            self._links[lk.id] = lk

    # Device Operations
    def get_all_devices(self) -> List[DeviceResponse]:
        return list(self._devices.values())

    def get_device_by_id(self, device_id: str) -> Optional[DeviceResponse]:
        return self._devices.get(device_id)

    def create_device(self, device_in: DeviceCreate) -> DeviceResponse:
        if device_in.id in self._devices:
            raise ValueError(f"Device with ID '{device_in.id}' already exists.")
        
        new_device = DeviceResponse(
            id=device_in.id,
            name=device_in.name,
            type=device_in.type,
            ip_address=device_in.ip_address,
            status=device_in.status,
            location=device_in.location,
            area=device_in.area,
            subnet_mask=device_in.subnet_mask,
            gateway=device_in.gateway,
            mac_address=device_in.mac_address or f"00:1A:2B:3C:{(len(self._devices)+1):02X}:{(len(self._devices)+1):02X}",
            x=device_in.x if device_in.x is not None else 300.0,
            y=device_in.y if device_in.y is not None else 300.0
        )
        self._devices[new_device.id] = new_device
        return new_device

    def update_device(self, device_id: str, update_in: DeviceUpdate) -> Optional[DeviceResponse]:
        dev = self._devices.get(device_id)
        if not dev:
            return None
        
        dev_data = dev.dict()
        for k, v in update_in.dict(exclude_unset=True).items():
            if v is not None:
                dev_data[k] = v
        
        updated_dev = DeviceResponse(**dev_data)
        self._devices[device_id] = updated_dev
        return updated_dev

    def delete_device(self, device_id: str) -> bool:
        if device_id in self._devices:
            del self._devices[device_id]
            # Also clean up associated links
            links_to_delete = [
                lid for lid, lk in self._links.items() 
                if lk.source_id == device_id or lk.target_id == device_id
            ]
            for lid in links_to_delete:
                del self._links[lid]
            return True
        return False

    # Link Operations
    def get_all_links(self) -> List[LinkResponse]:
        return list(self._links.values())

    def get_link_by_id(self, link_id: str) -> Optional[LinkResponse]:
        return self._links.get(link_id)

    def create_link(self, link_in: LinkCreate) -> LinkResponse:
        if link_in.source_id not in self._devices:
            raise ValueError(f"Source device '{link_in.source_id}' does not exist.")
        if link_in.target_id not in self._devices:
            raise ValueError(f"Target device '{link_in.target_id}' does not exist.")
        if link_in.source_id == link_in.target_id:
            raise ValueError("Cannot link a device to itself.")
        
        link_id = link_in.id or f"LINK-{link_in.source_id}-{link_in.target_id}"
        if link_id in self._links:
            raise ValueError(f"Link '{link_id}' already exists.")
        
        # Check if inverse link exists
        for lk in self._links.values():
            if (lk.source_id == link_in.source_id and lk.target_id == link_in.target_id) or \
               (lk.source_id == link_in.target_id and lk.target_id == link_in.source_id):
                raise ValueError("A link between these two devices already exists.")

        new_link = LinkResponse(
            id=link_id,
            source_id=link_in.source_id,
            target_id=link_in.target_id,
            bandwidth_mbps=link_in.bandwidth_mbps,
            latency_ms=link_in.latency_ms,
            loss_rate_percent=link_in.loss_rate_percent,
            status=link_in.status,
            link_type=link_in.link_type
        )
        self._links[link_id] = new_link
        return new_link

    def update_link(self, link_id: str, update_in: LinkUpdate) -> Optional[LinkResponse]:
        lk = self._links.get(link_id)
        if not lk:
            return None
        
        lk_data = lk.dict()
        for k, v in update_in.dict(exclude_unset=True).items():
            if v is not None:
                lk_data[k] = v
        
        updated_link = LinkResponse(**lk_data)
        self._links[link_id] = updated_link
        return updated_link

    def toggle_link_status(self, link_id: str) -> Optional[LinkResponse]:
        lk = self._links.get(link_id)
        if not lk:
            return None
        new_status = LinkStatus.DOWN if lk.status == LinkStatus.UP else LinkStatus.UP
        return self.update_link(link_id, LinkUpdate(status=new_status))

    def delete_link(self, link_id: str) -> bool:
        if link_id in self._links:
            del self._links[link_id]
            return True
        return False

    # Settings and State Export/Import
    def get_settings(self) -> NetworkSettings:
        return self._settings

    def update_settings(self, settings_in: NetworkSettings) -> NetworkSettings:
        self._settings = settings_in
        return self._settings

    def export_state(self) -> Dict[str, Any]:
        return {
            "devices": [dev.dict() for dev in self._devices.values()],
            "links": [lk.dict() for lk in self._links.values()],
            "settings": self._settings.dict()
        }

    def import_state(self, state_data: Dict[str, Any]) -> bool:
        try:
            new_devices = {}
            for d in state_data.get("devices", []):
                dev = DeviceResponse(**d)
                new_devices[dev.id] = dev
            
            new_links = {}
            for l in state_data.get("links", []):
                lk = LinkResponse(**l)
                new_links[lk.id] = lk
            
            self._devices = new_devices
            self._links = new_links
            if "settings" in state_data:
                self._settings = NetworkSettings(**state_data["settings"])
            return True
        except Exception as e:
            raise ValueError(f"Invalid state format: {str(e)}")


# Singleton instance
device_service = NetworkStoreService()
