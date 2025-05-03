
import { API_PROVIDERS, HYDERABAD_BOUNDING_BOX, RateLimiter } from './config';
import { 
  transformHereVehicleData, 
  transformHereCongestionData, 
  transformHereAnomalyData 
} from './transformers';
import { Vehicle, CongestionZone, Anomaly } from '../types';
import { toast } from '@/hooks/use-toast';

// Initialize rate limiter for HERE API
const rateLimiter = new RateLimiter(API_PROVIDERS.here.rateLimit);

/**
 * Fetches real-time flow data from HERE Traffic API
 */
export async function fetchHereTrafficFlow(): Promise<{
  vehicles: Vehicle[];
  congestion: CongestionZone[];
}> {
  // Check if HERE API is enabled
  if (!API_PROVIDERS.here.enabled) {
    throw new Error('HERE Traffic API is not configured');
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, flowEndpoint, apiKey, timeout } = API_PROVIDERS.here;
    
    // Construct query parameters
    const params = new URLSearchParams({
      apiKey,
      bbox: `${HYDERABAD_BOUNDING_BOX.north},${HYDERABAD_BOUNDING_BOX.west};${HYDERABAD_BOUNDING_BOX.south},${HYDERABAD_BOUNDING_BOX.east}`,
      responseattributes: 'sh,fc',
      units: 'metric'
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${flowEndpoint}?${params.toString()}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform HERE API data to our application's data model
    const vehicles = transformHereVehicleData(data);
    const congestion = transformHereCongestionData(data);

    return { vehicles, congestion };
  } catch (error) {
    console.error('Error fetching HERE traffic flow data:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "HERE API Request Timeout",
        description: "The request to the HERE Traffic API timed out. Please try again later.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Traffic Data Error",
        description: "Could not fetch traffic data from HERE API. Using cached data instead.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}

/**
 * Fetches traffic incidents/anomalies from HERE Traffic API
 */
export async function fetchHereTrafficIncidents(): Promise<Anomaly[]> {
  // Check if HERE API is enabled
  if (!API_PROVIDERS.here.enabled) {
    throw new Error('HERE Traffic API is not configured');
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, incidentEndpoint, apiKey, timeout } = API_PROVIDERS.here;
    
    // Construct query parameters
    const params = new URLSearchParams({
      apiKey,
      bbox: `${HYDERABAD_BOUNDING_BOX.north},${HYDERABAD_BOUNDING_BOX.west};${HYDERABAD_BOUNDING_BOX.south},${HYDERABAD_BOUNDING_BOX.east}`,
      criticality: 'minor,major,critical',
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${incidentEndpoint}?${params.toString()}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HERE API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform HERE API incident data to our application's anomaly model
    return transformHereAnomalyData(data);
  } catch (error) {
    console.error('Error fetching HERE traffic incidents:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "HERE API Request Timeout",
        description: "The request to the HERE Traffic Incidents API timed out. Please try again later.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}
