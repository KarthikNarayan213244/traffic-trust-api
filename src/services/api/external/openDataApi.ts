
import { API_PROVIDERS, RateLimiter } from './config';
import { 
  transformOpenDataVehicleData, 
  transformOpenDataCongestionData, 
  transformOpenDataAnomalyData 
} from './transformers';
import { Vehicle, CongestionZone, Anomaly } from '../types';
import { toast } from '@/hooks/use-toast';

// Initialize rate limiter for OpenData API
const rateLimiter = new RateLimiter(API_PROVIDERS.opendata.rateLimit);

/**
 * Fetches real-time traffic data from OpenData/Government API
 * This is a flexible implementation that can work with different open data APIs
 */
export async function fetchOpenDataTraffic(): Promise<{
  vehicles: Vehicle[];
  congestion: CongestionZone[];
  anomalies: Anomaly[];
}> {
  // Check if OpenData API is enabled
  if (!API_PROVIDERS.opendata.enabled) {
    throw new Error('OpenData Traffic API is not configured');
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, flowEndpoint, apiKey, timeout } = API_PROVIDERS.opendata;
    
    // Headers often required for government/open data APIs
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${flowEndpoint}`, {
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenData API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform OpenData API data to our application's data models
    const vehicles = transformOpenDataVehicleData(data);
    const congestion = transformOpenDataCongestionData(data);
    
    // For some open data APIs, anomalies might come from the same endpoint
    let anomalies: Anomaly[] = [];
    
    // Check if we need a separate call for incidents
    if (data.incidents) {
      anomalies = transformOpenDataAnomalyData(data);
    } else {
      // Separate API call for incidents if needed
      anomalies = await fetchOpenDataIncidents();
    }

    return { vehicles, congestion, anomalies };
  } catch (error) {
    console.error('Error fetching OpenData traffic data:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "OpenData API Request Timeout",
        description: "The request to the traffic data API timed out. Please try again later.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Traffic Data Error",
        description: "Could not fetch traffic data from the government API. Using cached data instead.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}

/**
 * Fetches traffic incidents separately if needed
 */
async function fetchOpenDataIncidents(): Promise<Anomaly[]> {
  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, incidentEndpoint, apiKey, timeout } = API_PROVIDERS.opendata;
    
    // Headers setup
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${incidentEndpoint}`, {
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenData incidents API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform incident data
    return transformOpenDataAnomalyData(data);
  } catch (error) {
    console.error('Error fetching OpenData incidents:', error);
    return []; // Return empty array on error
  }
}
