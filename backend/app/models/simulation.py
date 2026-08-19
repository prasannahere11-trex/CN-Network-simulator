from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class NetworkSettings(BaseModel):
    simulation_speed: float = Field(default=1.0, description="Simulation speed multiplier (0.25x - 5x)")
    global_loss_rate_percent: float = Field(default=0.0, description="Global random packet loss baseline")
    ospf_reference_bandwidth_mbps: float = Field(default=100000.0, description="OSPF Reference Bandwidth (100 Gbps)")
    default_mtu_bytes: int = Field(default=1500, description="Standard MTU size in bytes")
    auto_refresh_monitoring: bool = Field(default=True, description="Enable live monitoring push/poll")


class ScenarioAction(BaseModel):
    action_type: str  # cut_link, restore_link, disable_node, enable_node, inject_loss, traffic_burst
    target_id: str
    params: Optional[Dict[str, Any]] = None


class SimulationScenario(BaseModel):
    id: str
    title: str
    description: str
    category: str  # FAULT_TOLERANCE, PERFORMANCE, SECURITY, ROUTING
    actions: List[ScenarioAction]
    expected_outcome: str


class ScenarioRunResult(BaseModel):
    scenario_id: str
    scenario_title: str
    success: bool
    affected_links: List[str]
    affected_nodes: List[str]
    summary: str
    logs: List[str]


class BenchmarkTestResult(BaseModel):
    test_name: str
    source: str
    destination: str
    protocol: str
    passed: bool
    latency_ms: float
    hops: int
    details: str


class FullBenchmarkReport(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    health_score_percent: float
    avg_latency_ms: float
    results: List[BenchmarkTestResult]
    timestamp: str


class NetworkTelemetry(BaseModel):
    total_devices: int
    active_devices: int
    inactive_devices: int
    total_links: int
    active_links: int
    lan_devices: int
    man_devices: int
    wan_devices: int
    total_packets_simulated: int
    packets_delivered: int
    packets_dropped: int
    delivery_success_rate_percent: float
    avg_latency_ms: float
    current_throughput_mbps: float
    link_utilizations: List[Dict[str, Any]]
