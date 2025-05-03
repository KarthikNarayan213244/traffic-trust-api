
/**
 * External Traffic APIs Configuration
 * Supports multiple providers with fallback mechanisms
 */

// API Provider types
export type TrafficApiProvider = 'here' | 'tomtom' | 'opendata' | 'mock';

// API Configuration by provider
export const API_PROVIDERS = {
  // HERE Traffic API
  here: {
    baseUrl: 'https://traffic.ls.hereapi.com/traffic/6.2',
    flowEndpoint: '/flow.json',
    incidentEndpoint: '/incidents.json',
    apiKey: import.meta.env.VITE_HERE_API_KEY || '',
    enabled: Boolean(import.meta.env.VITE_HERE_API_KEY),
    rateLimit: 60, // requests per minute
    timeout: 10000, // 10 seconds - used for custom timeout handling, not in fetch directly
  },
  // TomTom Traffic API (primary)
  tomtom: {
    baseUrl: 'https://api.tomtom.com/traffic/services/4',
    flowEndpoint: '/flowSegmentData/absolute/10/json',
    incidentEndpoint: '/incidentDetails/s3/json',
    apiKey: import.meta.env.VITE_TOMTOM_API_KEY || 'pEwSxAaTM0quOL1x2WuqFFYRj7lGIJeL', // Use provided key as default
    enabled: true, // Always enable TomTom as we have the key
    rateLimit: 100, // Increased from 40 to 100 requests per minute
    timeout: 30000, // Increased from 12000 to 30000 ms for larger data fetching
  },
  // Open Data Platforms (e.g. government transportation APIs)
  opendata: {
    baseUrl: import.meta.env.VITE_OPENDATA_TRAFFIC_API || 'https://api.data.gov.in/resource/traffic-data',
    flowEndpoint: '/traffic-flow',
    incidentEndpoint: '/incidents',
    apiKey: import.meta.env.VITE_OPENDATA_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
    enabled: true, // Enable opendata by default with the provided key
    rateLimit: 60, // Increased from 30 to 60 requests per minute
    timeout: 30000, // Increased from 15000 to 30000 ms for larger data fetching
  },
  // Mock data (fallback when no API keys are available)
  mock: {
    enabled: true,
    rateLimit: 0, // no limit for mock data
    timeout: 500, // simulate network delay
  }
};

// Always use TomTom as primary provider since we have a working API key
export const getActiveProvider = (): TrafficApiProvider => {
  // Try to use opendata first, then tomtom
  if (API_PROVIDERS.opendata.enabled && API_PROVIDERS.opendata.apiKey) {
    return 'opendata';
  }
  return 'tomtom';
};

// Coordinates for the Hyderabad region - significantly expanded to cover more area
export const HYDERABAD_BOUNDING_BOX = {
  north: 17.8000, // north latitude (expanded from 17.6200)
  south: 17.1000, // south latitude (expanded from 17.2500)
  east: 78.9000,  // east longitude (expanded from 78.6500)
  west: 78.0000   // west longitude (expanded from 78.2500)
};

// Rate limiter for API calls
export class RateLimiter {
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private resetTime: number = 0;
  private readonly limit: number;
  private readonly timeWindow: number = 60000; // 1 minute in milliseconds

  constructor(requestsPerMinute: number) {
    this.limit = requestsPerMinute;
  }

  async throttle(): Promise<void> {
    if (this.limit <= 0) return; // No limit for mock data

    const now = Date.now();
    
    // Reset counter if time window has passed
    if (now > this.resetTime) {
      this.callCount = 0;
      this.resetTime = now + this.timeWindow;
    }

    // Check if we're at the limit
    if (this.callCount >= this.limit) {
      const waitTime = this.resetTime - now;
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.throttle(); // Recursive call after waiting
      }
    }

    // Update call count and time
    this.callCount++;
    this.lastCallTime = Date.now();
  }
}
