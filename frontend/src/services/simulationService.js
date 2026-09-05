/**
 * Simulation, Links, Routing, Telemetry, Presets, and Scenario API Client
 */

import { request } from './api';

// Links
export async function getLinks() {
  return await request('/links', { method: 'GET' });
}

export async function createLink(linkData) {
  return await request('/links', {
    method: 'POST',
    body: JSON.stringify(linkData),
  });
}

export async function updateLink(linkId, linkData) {
  return await request(`/links/${encodeURIComponent(linkId)}`, {
    method: 'PUT',
    body: JSON.stringify(linkData),
  });
}

export async function toggleLink(linkId) {
  return await request(`/links/${encodeURIComponent(linkId)}/toggle`, {
    method: 'POST',
  });
}

export async function deleteLink(linkId) {
  return await request(`/links/${encodeURIComponent(linkId)}`, {
    method: 'DELETE',
  });
}

// Packet Simulator
export async function sendPacket(packetData) {
  return await request('/packets/send', {
    method: 'POST',
    body: JSON.stringify(packetData),
  });
}

export async function getPacketHistory(limit = 50) {
  return await request(`/packets/history?limit=${limit}`, { method: 'GET' });
}

export async function clearPacketHistory() {
  return await request('/packets/history', { method: 'DELETE' });
}

// Routing Tables & Paths
export async function getRoutingTables(protocol = 'OSPF') {
  return await request(`/routing/tables?protocol=${protocol}`, { method: 'GET' });
}

export async function getDeviceRoutingTable(deviceId, protocol = 'OSPF') {
  return await request(`/routing/tables/${encodeURIComponent(deviceId)}?protocol=${protocol}`, {
    method: 'GET',
  });
}

export async function calculateShortestPath(sourceId, destinationId, protocol = 'OSPF') {
  return await request('/routing/path', {
    method: 'POST',
    body: JSON.stringify({
      source_id: sourceId,
      destination_id: destinationId,
      protocol: protocol,
    }),
  });
}

// Monitoring & Telemetry
export async function getTelemetry() {
  return await request('/monitoring/telemetry', { method: 'GET' });
}

// Scenarios & Chaos
export async function getScenarios() {
  return await request('/simulation/scenarios', { method: 'GET' });
}

export async function runScenario(scenarioId) {
  return await request(`/simulation/scenarios/${encodeURIComponent(scenarioId)}/run`, {
    method: 'POST',
  });
}

export async function runBenchmark() {
  return await request('/simulation/benchmark', { method: 'POST' });
}

// Sample Topology Presets & Structures
export async function getPresets() {
  return await request('/simulation/presets', { method: 'GET' });
}

export async function loadPreset(presetId) {
  return await request(`/simulation/presets/${encodeURIComponent(presetId)}/load`, {
    method: 'POST',
  });
}

// Settings & State
export async function getSettings() {
  return await request('/simulation/settings', { method: 'GET' });
}

export async function updateSettings(settingsData) {
  return await request('/simulation/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsData),
  });
}

export async function resetNetworkTopology() {
  return await request('/simulation/reset', { method: 'POST' });
}

export async function exportTopology() {
  return await request('/simulation/export', { method: 'GET' });
}

export async function importTopology(stateData) {
  return await request('/simulation/import', {
    method: 'POST',
    body: JSON.stringify(stateData),
  });
}
