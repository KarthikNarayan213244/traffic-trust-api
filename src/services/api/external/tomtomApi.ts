
import { API_PROVIDERS, HYDERABAD_BOUNDING_BOX, RateLimiter } from './config';
import { 
  transformTomTomVehicleData, 
  transformTomTomCongestionData, 
  transformTomTomAnomalyData 
} from './transformers';
import { Vehicle, CongestionZone, Anomaly } from '../types';
import { toast } from '@/hooks/use-toast';

// Initialize rate limiter for TomTom API
const rateLimiter = new RateLimiter(API_PROVIDERS.tomtom.rateLimit);

/**
 * Fetches real-time flow data from TomTom Traffic API
 */
export async function fetchTomTomTrafficFlow(): Promise<{
  vehicles: Vehicle[];
  congestion: CongestionZone[];
}> {
  // Check if TomTom API is enabled
  if (!API_PROVIDERS.tomtom.enabled) {
    throw new Error('TomTom Traffic API is not configured');
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, flowEndpoint, apiKey, timeout } = API_PROVIDERS.tomtom;
    
    // Construct query parameters
    const params = new URLSearchParams({
      key: apiKey,
      bbox: `${HYDERABAD_BOUNDING_BOX.west},${HYDERABAD_BOUNDING_BOX.south},${HYDERABAD_BOUNDING_BOX.east},${HYDERABAD_BOUNDING_BOX.north}`,
      unit: 'KMPH',
      style: 'absolute'
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${flowEndpoint}?${params.toString()}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform TomTom API data to our application's data model
    const vehicles = transformTomTomVehicleData(data);
    const congestion = transformTomTomCongestionData(data);

    return { vehicles, congestion };
  } catch (error) {
    console.error('Error fetching TomTom traffic flow data:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "TomTom API Request Timeout",
        description: "The request to the TomTom Traffic API timed out. Please try again later.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Traffic Data Error",
        description: "Could not fetch traffic data from TomTom API. Using cached data instead.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}

/**
 * Fetches traffic incidents/anomalies from TomTom Traffic API
 */
export async function fetchTomTomTrafficIncidents(): Promise<Anomaly[]> {
  // Check if TomTom API is enabled
  if (!API_PROVIDERS.tomtom.enabled) {
    throw new Error('TomTom Traffic API is not configured');
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, incidentEndpoint, apiKey, timeout } = API_PROVIDERS.tomtom;
    
    // Construct query parameters
    const params = new URLSearchParams({
      key: apiKey,
      bbox: `${HYDERABAD_BOUNDING_BOX.west},${HYDERABAD_BOUNDING_BOX.south},${HYDERABAD_BOUNDING_BOX.east},${HYDERABAD_BOUNDING_BOX.north}`,
      fields: 'incidents',
      language: 'en-GB',
      timeValidityFilter: 'present'
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${incidentEndpoint}?${params.toString()}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform TomTom API incident data to our application's anomaly model
    return transformTomTomAnomalyData(data);
  } catch (error) {
    console.error('Error fetching TomTom traffic incidents:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "TomTom API Request Timeout",
        description: "The request to the TomTom Traffic Incidents API timed out. Please try again later.",
        variant: "destructive",
      });
    }
    
    throw error;
  }
}
