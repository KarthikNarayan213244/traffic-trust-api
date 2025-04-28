
// API configuration and helper functions
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
  endpoints: {
    vehicles: "/api/vehicles",
    rsus: "/api/rsus",
    anomalies: "/api/anomalies",
    trustLedger: "/api/trust/live_ledger",
    congestion: "/api/zones_congestion"
  }
};

export type ApiEndpoint = keyof typeof API_CONFIG.endpoints;

// Generic fetch function used by all domain-specific services
export async function fetchData(endpoint: ApiEndpoint, options = {}) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched data from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
}
