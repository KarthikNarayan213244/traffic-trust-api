
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

// API endpoints
export const ENDPOINTS = {
  VEHICLES: '/vehicles',
  RSUS: '/rsus',
  ANOMALIES: '/anomalies',
  TRUST_LEDGER: '/trust-ledger',
  CONGESTION: '/congestion',
  SIMULATION: '/simulation',
};

// Authentication key (if needed)
export const API_KEY = import.meta.env.VITE_API_KEY || '';

// Whether to use mock data when API is not available
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;

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
};
