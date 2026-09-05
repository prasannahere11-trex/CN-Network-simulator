/**
 * Base API Service & Dual-Engine Router
 * 
 * Automatically communicates with FastAPI backend when available,
 * and transparently executes with the high-fidelity In-Browser Client Engine
 * when deployed as a static site on Vercel or running offline.
 */

import { clientSimulationEngine, PRESET_TOPOLOGIES } from './clientSimulationEngine';

let isLiveBackendActive = false;

export function getEngineStatus() {
  return {
    isLiveBackend: isLiveBackendActive,
    label: isLiveBackendActive ? 'FastAPI Server' : 'In-Browser Simulator',
    isStaticVercel: !isLiveBackendActive,
  };
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('campus_api_url');
    if (custom && custom.trim()) {
      let trimmed = custom.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
        trimmed = `https://${trimmed}`;
      }
      if (!trimmed.endsWith('/api') && !trimmed.endsWith('/')) {
        trimmed = `${trimmed}/api`;
      }
      return trimmed;
    }
  }

  let rawApiUrl = import.meta.env.VITE_API_URL || '/api';
  if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://') && !rawApiUrl.startsWith('/')) {
    rawApiUrl = `https://${rawApiUrl}/api`;
  } else if (rawApiUrl && (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')) && !rawApiUrl.endsWith('/api')) {
    rawApiUrl = `${rawApiUrl.replace(/\/$/, '')}/api`;
  }
  return rawApiUrl;
}

export function setCustomApiUrl(url) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('campus_api_url', url.trim());
    } else {
      localStorage.removeItem('campus_api_url');
    }
  }
}

/**
 * Handle endpoint via client simulation engine fallback
 */
function handleClientEngine(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Health
  if (cleanEndpoint === '/health') {
    return { status: 'ok', service: 'In-Browser Client Simulation Engine (Vercel Ready)' };
  }

  // Presets
  if (cleanEndpoint === '/simulation/presets') {
    return PRESET_TOPOLOGIES;
  }
  if (cleanEndpoint.startsWith('/simulation/presets/') && cleanEndpoint.endsWith('/load')) {
    const parts = cleanEndpoint.split('/');
    const presetId = parts[3];
    return clientSimulationEngine.loadPreset(presetId);
  }

  // Devices
  if (cleanEndpoint === '/devices') {
    if (method === 'GET') return clientSimulationEngine.getDevices();
    if (method === 'POST') return clientSimulationEngine.createDevice(body);
  }
  if (cleanEndpoint.startsWith('/devices/')) {
    const devId = decodeURIComponent(cleanEndpoint.replace('/devices/', ''));
    if (method === 'GET') return clientSimulationEngine.getDeviceById(devId);
    if (method === 'PUT') return clientSimulationEngine.updateDevice(devId, body);
    if (method === 'DELETE') return clientSimulationEngine.deleteDevice(devId);
  }

  // Links
  if (cleanEndpoint === '/links') {
    if (method === 'GET') return clientSimulationEngine.getLinks();
    if (method === 'POST') return clientSimulationEngine.createLink(body);
  }
  if (cleanEndpoint.startsWith('/links/')) {
    const rest = cleanEndpoint.replace('/links/', '');
    if (rest.endsWith('/toggle')) {
      const linkId = decodeURIComponent(rest.replace('/toggle', ''));
      return clientSimulationEngine.toggleLink(linkId);
    }
    const linkId = decodeURIComponent(rest);
    if (method === 'PUT') return clientSimulationEngine.updateLink(linkId, body);
    if (method === 'DELETE') return clientSimulationEngine.deleteLink(linkId);
  }

  // Packets
  if (cleanEndpoint === '/packets/send') {
    return clientSimulationEngine.sendPacket(body);
  }
  if (cleanEndpoint.startsWith('/packets/history')) {
    if (method === 'GET') return clientSimulationEngine.getPacketHistory();
    if (method === 'DELETE') return clientSimulationEngine.clearPacketHistory();
  }

  // Routing
  if (cleanEndpoint.startsWith('/routing/tables')) {
    const urlParts = cleanEndpoint.split('?');
    const pathPart = urlParts[0];
    const urlParams = new URLSearchParams(urlParts[1] || '');
    const protocol = urlParams.get('protocol') || 'OSPF';

    if (pathPart === '/routing/tables' || pathPart === '/routing/tables/') {
      return clientSimulationEngine.getRoutingTables(protocol);
    }
    const devId = decodeURIComponent(pathPart.replace('/routing/tables/', ''));
    return clientSimulationEngine.getDeviceRoutingTable(devId, protocol);
  }
  if (cleanEndpoint === '/routing/path') {
    return clientSimulationEngine.calculatePath(body.source_id, body.destination_id, body.protocol || 'OSPF');
  }

  // Monitoring
  if (cleanEndpoint === '/monitoring/telemetry') {
    return clientSimulationEngine.getTelemetry();
  }

  // Simulation & Scenarios
  if (cleanEndpoint === '/simulation/scenarios') {
    return clientSimulationEngine.getScenarios();
  }
  if (cleanEndpoint.startsWith('/simulation/scenarios/') && cleanEndpoint.endsWith('/run')) {
    const parts = cleanEndpoint.split('/');
    const scId = parts[3];
    return clientSimulationEngine.runScenario(scId);
  }
  if (cleanEndpoint === '/simulation/benchmark') {
    return clientSimulationEngine.runBenchmark();
  }
  if (cleanEndpoint === '/simulation/settings') {
    if (method === 'GET') return clientSimulationEngine.getSettings();
    if (method === 'PUT') return clientSimulationEngine.updateSettings(body);
  }
  if (cleanEndpoint === '/simulation/reset') {
    return clientSimulationEngine.resetDefault();
  }
  if (cleanEndpoint === '/simulation/export') {
    return clientSimulationEngine.exportState();
  }
  if (cleanEndpoint === '/simulation/import') {
    return clientSimulationEngine.importState(body);
  }

  throw new Error(`Endpoint ${endpoint} not handled by simulation engine.`);
}

/**
 * Standard request wrapper with live backend fetching and client fallback
 */
export async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${cleanEndpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // If running in browser and targeting standard /api without remote host, or remote fails:
  try {
    const response = await fetch(url, config);

    // If server responded with HTML (common when static host rewrites /api to index.html)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      isLiveBackendActive = false;
      return handleClientEngine(endpoint, options);
    }

    if (!response.ok) {
      // If 404 on API endpoint, check client fallback
      if (response.status === 404 && !baseUrl.includes('http')) {
        isLiveBackendActive = false;
        return handleClientEngine(endpoint, options);
      }

      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Not JSON
      }
      throw new Error(errorMessage);
    }

    isLiveBackendActive = true;
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    // If remote connection failed, fallback to in-browser client simulation
    isLiveBackendActive = false;
    try {
      return handleClientEngine(endpoint, options);
    } catch {
      throw error;
    }
  }
}
