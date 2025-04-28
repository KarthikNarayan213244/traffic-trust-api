
// API configuration and helper functions
export const API_CONFIG = {
  baseUrl: "http://localhost:5000", // This can be updated to your API URL
  endpoints: {
    vehicles: "/api/vehicles",
    rsus: "/api/rsus",
    anomalies: "/api/anomalies",
    trustLedger: "/api/trust/live_ledger",
    congestion: "/api/congestion"
  }
};

export type ApiEndpoint = keyof typeof API_CONFIG.endpoints;

// Generic fetch function used by all domain-specific services
export async function fetchData(endpoint: ApiEndpoint, options = {}) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    // If API fails, fall back to mock data for development
    throw error;
  }
}
