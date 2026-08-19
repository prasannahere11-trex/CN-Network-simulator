/**
 * Device and System Health API Service
 */

import { request } from './api';

export async function checkHealth() {
  return await request('/health', { method: 'GET' });
}

export async function getDevices() {
  return await request('/devices', { method: 'GET' });
}

export async function getDeviceById(deviceId) {
  return await request(`/devices/${encodeURIComponent(deviceId)}`, { method: 'GET' });
}

export async function createDevice(deviceData) {
  return await request('/devices', {
    method: 'POST',
    body: JSON.stringify(deviceData),
  });
}

export async function updateDevice(deviceId, deviceData) {
  return await request(`/devices/${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify(deviceData),
  });
}

export async function deleteDevice(deviceId) {
  return await request(`/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
}
