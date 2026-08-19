from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.link import LinkCreate, LinkUpdate, LinkResponse
from app.services.device_service import device_service

router = APIRouter(prefix="/links", tags=["Links"])


@router.get("", response_model=List[LinkResponse])
def list_links():
    """Retrieve all network links interconnecting devices."""
    return device_service.get_all_links()


@router.post("", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
def create_link(link_in: LinkCreate):
    """Establish a new link interconnect between two devices."""
    try:
        return device_service.create_link(link_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{link_id}", response_model=LinkResponse)
def get_link(link_id: str):
    """Get link parameters by ID."""
    link = device_service.get_link_by_id(link_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' not found"
        )
    return link


@router.put("/{link_id}", response_model=LinkResponse)
def update_link(link_id: str, update_in: LinkUpdate):
    """Modify link bandwidth, latency, loss rate, or status."""
    link = device_service.update_link(link_id, update_in)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' not found"
        )
    return link


@router.post("/{link_id}/toggle", response_model=LinkResponse)
def toggle_link(link_id: str):
    """Toggle physical link status between UP and DOWN (Cable cut simulation)."""
    link = device_service.toggle_link_status(link_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' not found"
        )
    return link


@router.delete("/{link_id}", status_code=status.HTTP_200_OK)
def delete_link(link_id: str):
    """Sever and remove a link from the topology."""
    deleted = device_service.delete_link(link_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' not found"
        )
    return {"message": f"Link '{link_id}' successfully removed", "id": link_id}
