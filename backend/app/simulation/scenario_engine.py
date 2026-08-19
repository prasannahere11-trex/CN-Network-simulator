from datetime import datetime
from typing import List, Dict, Any, Optional

from app.models.device import DeviceStatus
from app.models.link import LinkStatus, LinkUpdate
from app.models.packet import ProtocolType, PacketSendRequest
from app.models.simulation import (
    SimulationScenario, ScenarioAction, ScenarioRunResult,
    BenchmarkTestResult, FullBenchmarkReport, NetworkTelemetry
)
from app.services.device_service import device_service
from app.simulation.packet_engine import packet_engine


class ScenarioEngine:
    def __init__(self):
        pass

    def get_prebuilt_scenarios(self) -> List[SimulationScenario]:
        return [
            SimulationScenario(
                id="scenario-cut-man-ring",
                title="MAN Backbone Fiber Cut (Failover Test)",
                description="Simulate a physical fiber cable severance between North Core Router (RT-CORE-1) and South Core Router (RT-CORE-2) to test dynamic OSPF rerouting via Campus Aggregation Switch (SW-CORE).",
                category="FAULT_TOLERANCE",
                actions=[
                    ScenarioAction(action_type="cut_link", target_id="LINK-RTCORE1-RTCORE2")
                ],
                expected_outcome="Direct link goes DOWN. Dynamic routing converges to alternate path via SW-CORE with slightly higher latency."
            ),
            SimulationScenario(
                id="scenario-ddos-web",
                title="DDoS Attack on Campus Web Portal",
                description="Simulate a distributed denial-of-service volumetric flood against the Campus Web Portal (SRV-001), saturating the switch link and causing high packet loss.",
                category="SECURITY",
                actions=[
                    ScenarioAction(action_type="inject_loss", target_id="LINK-SWDC-SRV001", params={"loss_rate_percent": 35.0, "latency_ms": 120.0})
                ],
                expected_outcome="Link latency spikes from 0.5ms to 120ms with 35% packet drop rate."
            ),
            SimulationScenario(
                id="scenario-core-congestion",
                title="North Campus Core Router Congestion",
                description="Simulate severe peak hour congestion on the North Campus Core gateway, throttling link bandwidth down to 10 Mbps.",
                category="PERFORMANCE",
                actions=[
                    ScenarioAction(action_type="throttle_bandwidth", target_id="LINK-RT001-RTCORE1", params={"bandwidth_mbps": 10.0, "latency_ms": 45.0})
                ],
                expected_outcome="Bandwidth reduced from 10 Gbps to 10 Mbps; latency increases from 2ms to 45ms."
            ),
            SimulationScenario(
                id="scenario-wan-loss",
                title="WAN Uplink Degradation & Packet Storm",
                description="Simulate erratic carrier degradation on the external WAN ISP link connecting the campus border router to cloud hosts.",
                category="PERFORMANCE",
                actions=[
                    ScenarioAction(action_type="inject_loss", target_id="LINK-RTWAN-SRVCLOUD", params={"loss_rate_percent": 25.0, "latency_ms": 95.0})
                ],
                expected_outcome="Internet traffic to 8.8.8.8 experiences high loss and 95ms latency."
            ),
            SimulationScenario(
                id="scenario-restore-all",
                title="Restore Normal Network State (Clear All Faults)",
                description="Restore all severed links to UP state, reset default 10 Gbps / 1 Gbps bandwidths, and eliminate artificial packet drops.",
                category="RECOVERY",
                actions=[
                    ScenarioAction(action_type="restore_all", target_id="ALL")
                ],
                expected_outcome="All devices and links return to 100% nominal operational state."
            )
        ]

    def run_scenario(self, scenario_id: str) -> ScenarioRunResult:
        scenarios = {s.id: s for s in self.get_prebuilt_scenarios()}
        if scenario_id not in scenarios:
            raise ValueError(f"Scenario '{scenario_id}' not found.")

        scenario = scenarios[scenario_id]
        affected_links: List[str] = []
        affected_nodes: List[str] = []
        logs: List[str] = []

        if scenario_id == "scenario-restore-all":
            # Reset topology to clean default
            device_service.reset_to_default_topology()
            logs.append("Reset all links and devices to factory default topology state.")
            logs.append("All link statuses set to UP, 0% packet loss.")
            return ScenarioRunResult(
                scenario_id=scenario.id,
                scenario_title=scenario.title,
                success=True,
                affected_links=["ALL_LINKS"],
                affected_nodes=["ALL_NODES"],
                summary="Successfully restored all network links and nodes to nominal operational state.",
                logs=logs
            )

        for action in scenario.actions:
            if action.action_type == "cut_link":
                lk = device_service.update_link(action.target_id, LinkUpdate(status=LinkStatus.DOWN))
                if lk:
                    affected_links.append(action.target_id)
                    logs.append(f"Severed physical link '{action.target_id}' (Status: DOWN).")
                else:
                    logs.append(f"Warning: Link '{action.target_id}' not found.")

            elif action.action_type == "inject_loss":
                params = action.params or {}
                loss = params.get("loss_rate_percent", 20.0)
                lat = params.get("latency_ms", 50.0)
                lk = device_service.update_link(action.target_id, LinkUpdate(loss_rate_percent=loss, latency_ms=lat))
                if lk:
                    affected_links.append(action.target_id)
                    logs.append(f"Injected {loss}% loss and {lat}ms latency on link '{action.target_id}'.")

            elif action.action_type == "throttle_bandwidth":
                params = action.params or {}
                bw = params.get("bandwidth_mbps", 10.0)
                lat = params.get("latency_ms", 30.0)
                lk = device_service.update_link(action.target_id, LinkUpdate(bandwidth_mbps=bw, latency_ms=lat))
                if lk:
                    affected_links.append(action.target_id)
                    logs.append(f"Throttled bandwidth on '{action.target_id}' to {bw} Mbps with {lat}ms latency.")

        summary = f"Executed scenario '{scenario.title}'. {len(affected_links)} links affected."
        return ScenarioRunResult(
            scenario_id=scenario.id,
            scenario_title=scenario.title,
            success=True,
            affected_links=affected_links,
            affected_nodes=affected_nodes,
            summary=summary,
            logs=logs
        )

    def run_benchmark_suite(self) -> FullBenchmarkReport:
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        test_matrix = [
            {"name": "Intra-LAN Local Communication", "src": "PC-001", "dst": "PC-002", "proto": ProtocolType.ICMP, "size": 64},
            {"name": "Inter-LAN (CSE -> ECE) via MAN Ring", "src": "PC-001", "dst": "PC-003", "proto": ProtocolType.ICMP, "size": 64},
            {"name": "Campus Web Portal HTTP Request", "src": "PC-001", "dst": "SRV-001", "proto": ProtocolType.HTTP, "size": 256},
            {"name": "Campus Authoritative DNS Query", "src": "PC-003", "dst": "SRV-002", "proto": ProtocolType.DNS, "size": 128},
            {"name": "Campus-to-Cloud Public WAN Uplink", "src": "PC-001", "dst": "SRV-CLOUD", "proto": ProtocolType.TCP, "size": 512},
            {"name": "MAN Core to WAN Gateway Transit", "src": "RT-CORE-1", "dst": "RT-WAN", "proto": ProtocolType.ICMP, "size": 64},
        ]

        results: List[BenchmarkTestResult] = []
        passed_count = 0
        total_latency = 0.0

        for t in test_matrix:
            req = PacketSendRequest(
                source_id=t["src"],
                destination_id=t["dst"],
                protocol=t["proto"],
                size_bytes=t["size"],
                ttl=64,
                payload=f"Benchmark Test: {t['name']}"
            )
            sim_res = packet_engine.send_packet(req)
            passed = sim_res.status == "SUCCESS"
            if passed:
                passed_count += 1
                total_latency += sim_res.total_latency_ms

            results.append(BenchmarkTestResult(
                test_name=t["name"],
                source=f"{sim_res.source_name} ({sim_res.source_ip})",
                destination=f"{sim_res.destination_name} ({sim_res.destination_ip})",
                protocol=t["proto"].value,
                passed=passed,
                latency_ms=sim_res.total_latency_ms,
                hops=len(sim_res.hops),
                details=sim_res.details
            ))

        total_tests = len(test_matrix)
        failed_count = total_tests - passed_count
        health_score = round((passed_count / total_tests) * 100.0, 1) if total_tests > 0 else 0.0
        avg_lat = round(total_latency / max(1, passed_count), 2)

        return FullBenchmarkReport(
            total_tests=total_tests,
            passed_tests=passed_count,
            failed_tests=failed_count,
            health_score_percent=health_score,
            avg_latency_ms=avg_lat,
            results=results,
            timestamp=timestamp_str
        )

    def get_telemetry(self) -> NetworkTelemetry:
        devices = device_service.get_all_devices()
        links = device_service.get_all_links()
        history = packet_engine.get_history(limit=100)

        total_devices = len(devices)
        active_devices = sum(1 for d in devices if d.status == DeviceStatus.ACTIVE)
        inactive_devices = total_devices - active_devices

        total_links = len(links)
        active_links = sum(1 for l in links if l.status == LinkStatus.UP)

        lan_devs = sum(1 for d in devices if d.area == "LAN")
        man_devs = sum(1 for d in devices if d.area == "MAN")
        wan_devs = sum(1 for d in devices if d.area == "WAN")

        total_pkts = len(history)
        delivered_pkts = sum(1 for p in history if p.status == "SUCCESS")
        dropped_pkts = total_pkts - delivered_pkts
        success_rate = round((delivered_pkts / total_pkts) * 100.0, 1) if total_pkts > 0 else 100.0

        avg_lat = (
            round(sum(p.total_latency_ms for p in history if p.status == "SUCCESS") / max(1, delivered_pkts), 2)
            if delivered_pkts > 0
            else 2.4
        )

        # Estimate live throughput in Mbps
        throughput = round(sum(p.size_bytes * 8.0 for p in history[:10]) / (1024.0 * 1024.0), 3) if total_pkts > 0 else 4.82

        link_utils = []
        for lk in links:
            load_pct = 0.0 if lk.status != LinkStatus.UP else round(min(98.5, max(1.2, (100.0 / max(1.0, lk.bandwidth_mbps)) * 15.0 + lk.loss_rate_percent * 2.0)), 1)
            link_utils.append({
                "link_id": lk.id,
                "source_id": lk.source_id,
                "target_id": lk.target_id,
                "bandwidth_mbps": lk.bandwidth_mbps,
                "latency_ms": lk.latency_ms,
                "status": str(lk.status),
                "utilization_percent": load_pct
            })

        return NetworkTelemetry(
            total_devices=total_devices,
            active_devices=active_devices,
            inactive_devices=inactive_devices,
            total_links=total_links,
            active_links=active_links,
            lan_devices=lan_devs,
            man_devices=man_devs,
            wan_devices=wan_devs,
            total_packets_simulated=total_pkts,
            packets_delivered=delivered_pkts,
            packets_dropped=dropped_pkts,
            delivery_success_rate_percent=success_rate,
            avg_latency_ms=avg_lat,
            current_throughput_mbps=throughput,
            link_utilizations=link_utils
        )


# Singleton
scenario_engine = ScenarioEngine()
