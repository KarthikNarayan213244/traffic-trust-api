
// API configuration settings

// Base URL for the API
const BASE_URL = import.meta.env.VITE_API_URL || 'https://traffic-trust-api.example.com';

// API version
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

// Complete API URL
export const API_URL = `${BASE_URL}/${API_VERSION}`;

// Default request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Default number of retries for failed requests
export const REQUEST_RETRIES = 3;

// API endpoints as string values for proper type matching
export const ENDPOINTS = {
  vehicles: 'vehicles',
  rsus: 'rsus',
  anomalies: 'anomalies',
  trustLedger: 'trustLedger',
  congestion: 'congestion',
  simulation: 'simulation',
};

// Type definition for API endpoint keys - this needs to match the keys in ENDPOINTS
export type ApiEndpoint = keyof typeof ENDPOINTS;

// Authentication key (if needed)
export const API_KEY = import.meta.env.VITE_API_KEY || '';

// Whether to use mock data when API is not available
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;

// Basic fetch data function to handle API requests
export const fetchData = async <T>(endpoint: string, options = {}): Promise<T> => {
  try {
    // Implementation would go here for direct API fetching
    // This is a placeholder implementation that returns mock data
    console.warn(`Using mock data for endpoint: ${endpoint} as fetchData is just a placeholder`);
    
    // Instead of directly importing functions that don't exist, we'll use dynamic imports
    // and handle the possibility that the mock functions might not exist
    if (endpoint.includes('vehicles')) {
      return [] as unknown as T; // Return empty array as fallback
    }
    
    if (endpoint.includes('rsus')) {
      return [] as unknown as T; // Return empty array as fallback
    }
    
    if (endpoint.includes('anomalies')) {
      return [] as unknown as T; // Return empty array as fallback
    }
    
    if (endpoint.includes('congestion')) {
      return [] as unknown as T; // Return empty array as fallback
    }
    
    if (endpoint.includes('trust-ledger') || endpoint.includes('trustLedger')) {
      return [] as unknown as T; // Return empty array as fallback
    }
    
    return [] as unknown as T;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

// Export all configuration
export default {
  API_URL,
  REQUEST_TIMEOUT,
  REQUEST_RETRIES,
  ENDPOINTS,
  API_KEY,
  USE_MOCK_DATA,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  fetchData,
};
