
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
    timeout: 10000, // 10 seconds
  },
  // TomTom Traffic API (primary)
  tomtom: {
    baseUrl: 'https://api.tomtom.com/traffic/services/4',
    flowEndpoint: '/flowSegmentData/absolute/10/json',
    incidentEndpoint: '/incidentDetails/s3/json',
    apiKey: import.meta.env.VITE_TOMTOM_API_KEY || 'pEwSxAaTM0quOL1x2WuqFFYRj7lGIJeL', // Use provided key as default
    enabled: true, // Always enable TomTom as we have the key
    rateLimit: 40, // requests per minute
    timeout: 12000, // 12 seconds
  },
  // Open Data Platforms (e.g. government transportation APIs)
  opendata: {
    baseUrl: import.meta.env.VITE_OPENDATA_TRAFFIC_API || '',
    flowEndpoint: '/traffic-flow',
    incidentEndpoint: '/incidents',
    apiKey: import.meta.env.VITE_OPENDATA_API_KEY || '',
    enabled: Boolean(import.meta.env.VITE_OPENDATA_API_KEY && import.meta.env.VITE_OPENDATA_TRAFFIC_API),
    rateLimit: 30, // requests per minute
    timeout: 15000, // 15 seconds
  },
  // Mock data (fallback when no API keys are available)
  mock: {
    enabled: true,
    rateLimit: 0, // no limit for mock data
    timeout: 500, // simulate network delay
  }
};

// Current active provider, prioritize TomTom over other options
export const getActiveProvider = (): TrafficApiProvider => {
  // Always return TomTom as we now have the API key
  return 'tomtom';
};

// Coordinates for the Hyderabad region
export const HYDERABAD_BOUNDING_BOX = {
  north: 17.5450, // north latitude
  south: 17.3450, // south latitude
  east: 78.5900,  // east longitude
  west: 78.3400   // west longitude
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
