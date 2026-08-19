from typing import List
from fastapi import APIRouter, HTTPException, Query, status
from app.models.packet import PacketSendRequest, PacketSimulationResult
from app.simulation.packet_engine import packet_engine

router = APIRouter(prefix="/packets", tags=["Packet Simulator"])


@router.post("/send", response_model=PacketSimulationResult, status_code=status.HTTP_200_OK)
def simulate_packet(req: PacketSendRequest):
    """Simulate transmission of a packet across the campus network topology."""
    try:
        return packet_engine.send_packet(req)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/history", response_model=List[PacketSimulationResult])
def get_packet_history(limit: int = Query(50, ge=1, le=150)):
    """Retrieve recent packet simulation logs with full hop and header details."""
    return packet_engine.get_history(limit=limit)


@router.delete("/history", status_code=status.HTTP_200_OK)
def clear_packet_history():
    """Clear all packet simulation history logs."""
    packet_engine.clear_history()
    return {"message": "Packet simulation history cleared successfully"}
