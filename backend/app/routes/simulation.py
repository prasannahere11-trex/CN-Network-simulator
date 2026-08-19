from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.models.simulation import (
    SimulationScenario, ScenarioRunResult, FullBenchmarkReport,
    NetworkSettings
)
from app.simulation.scenario_engine import scenario_engine
from app.services.device_service import device_service

router = APIRouter(prefix="/simulation", tags=["Simulation & Scenarios"])


@router.get("/scenarios", response_model=List[SimulationScenario])
def list_scenarios():
    """List all available chaos and fault tolerance scenarios."""
    return scenario_engine.get_prebuilt_scenarios()


@router.post("/scenarios/{scenario_id}/run", response_model=ScenarioRunResult)
def run_scenario(scenario_id: str):
    """Execute a chaos engineering scenario (e.g. cable cut, ddos, congestion)."""
    try:
        return scenario_engine.run_scenario(scenario_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/benchmark", response_model=FullBenchmarkReport)
def run_full_benchmark():
    """Execute full automated campus network diagnostic test suite across all subnets."""
    return scenario_engine.run_benchmark_suite()


@router.get("/settings", response_model=NetworkSettings)
def get_settings():
    """Get current global simulation settings."""
    return device_service.get_settings()


@router.put("/settings", response_model=NetworkSettings)
def update_settings(settings_in: NetworkSettings):
    """Update global network simulation parameters."""
    return device_service.update_settings(settings_in)


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_network_topology():
    """Reset network topology to default multi-area campus network with all links UP."""
    device_service.reset_to_default_topology()
    return {"message": "Network topology reset to factory default state successfully."}


@router.get("/export", response_model=Dict[str, Any])
def export_topology_state():
    """Export complete network state (devices, links, settings) as JSON."""
    return device_service.export_state()


@router.post("/import", status_code=status.HTTP_200_OK)
def import_topology_state(state_data: Dict[str, Any]):
    """Import a full network topology state from JSON."""
    try:
        device_service.import_state(state_data)
        return {"message": "Network state imported successfully."}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
