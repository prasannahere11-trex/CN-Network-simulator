from .device_service import device_service, NetworkStoreService

# Backward compatibility alias
DeviceService = NetworkStoreService

__all__ = ["device_service", "NetworkStoreService", "DeviceService"]
