from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.device import DeviceCreate, DeviceUpdate, DeviceResponse
from app.services.device_service import device_service

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceResponse])
def list_devices():
    """Retrieve all devices in the campus network."""
    return device_service.get_all_devices()


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(device_in: DeviceCreate):
    """Add a new device to the campus network."""
    try:
        return device_service.create_device(device_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str):
    """Retrieve details of a single device by its ID."""
    device = device_service.get_device_by_id(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found"
        )
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(device_id: str, update_in: DeviceUpdate):
    """Update device properties or coordinates."""
    updated = device_service.update_device(device_id, update_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found"
        )
    return updated


@router.delete("/{device_id}", status_code=status.HTTP_200_OK)
def delete_device(device_id: str):
    """Remove a device and its attached links from the campus network."""
    deleted = device_service.delete_device(device_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' not found"
        )
    return {"message": f"Device '{device_id}' successfully removed", "id": device_id}
