from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.models.routing import (
    RoutingProtocol, RoutingTableResponse, ShortestPathRequest,
    ShortestPathResponse
)
from app.simulation.routing_engine import routing_engine
from app.services.device_service import device_service

router = APIRouter(prefix="/routing", tags=["Routing Protocols & Tables"])


@router.get("/tables/{device_id}", response_model=RoutingTableResponse)
def get_device_routing_table(
    device_id: str,
    protocol: RoutingProtocol = Query(RoutingProtocol.OSPF, description="Routing Protocol (OSPF, RIP, STATIC)")
):
    """Retrieve computed routing table for a specific router or host device."""
    try:
        return routing_engine.get_routing_table_for_device(device_id, protocol)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/tables", response_model=List[RoutingTableResponse])
def get_all_routing_tables(
    protocol: RoutingProtocol = Query(RoutingProtocol.OSPF, description="Routing Protocol (OSPF, RIP, STATIC)")
):
    """Retrieve routing tables for all routers and gateways in the network."""
    devices = device_service.get_all_devices()
    routers_and_switches = [d for d in devices if d.type in ["Router", "Switch"]]
    tables = []
    for d in routers_and_switches:
        try:
            tables.append(routing_engine.get_routing_table_for_device(d.id, protocol))
        except Exception:
            continue
    return tables


@router.post("/path", response_model=ShortestPathResponse)
def calculate_path(req: ShortestPathRequest):
    """Compute shortest path between any two devices under OSPF (SPF) or RIP (Bellman-Ford)."""
    return routing_engine.calculate_shortest_path(
        req.source_id,
        req.destination_id,
        req.protocol
    )
