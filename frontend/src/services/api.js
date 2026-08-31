/**
 * Base API Service
 * Uses native fetch API exclusively to communicate with the FastAPI backend.
 */

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
 * Standard fetch wrapper with JSON parsing and error handling.
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

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Response was not JSON
      }
      throw new Error(errorMessage);
    }

    // Return parsed JSON if content exists
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`API Request Error [${config.method || 'GET'} ${url}]:`, error);
    throw error;
  }
}
