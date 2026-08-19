from fastapi import APIRouter
from app.models.simulation import NetworkTelemetry
from app.simulation.scenario_engine import scenario_engine

router = APIRouter(prefix="/monitoring", tags=["Network Telemetry & Monitoring"])


@router.get("/telemetry", response_model=NetworkTelemetry)
def get_live_telemetry():
    """Retrieve real-time network telemetry, throughput, packet statistics, and link utilization heatmap."""
    return scenario_engine.get_telemetry()
