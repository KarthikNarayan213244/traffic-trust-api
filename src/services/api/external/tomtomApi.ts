
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
    console.warn('TomTom Traffic API is not configured');
    return { vehicles: [], congestion: [] };
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, flowEndpoint, apiKey, timeout } = API_PROVIDERS.tomtom;
    
    // TomTom API requires a point parameter rather than just a bounding box
    // Let's use the center of our bounding box as the point
    const centerLat = (HYDERABAD_BOUNDING_BOX.north + HYDERABAD_BOUNDING_BOX.south) / 2;
    const centerLng = (HYDERABAD_BOUNDING_BOX.east + HYDERABAD_BOUNDING_BOX.west) / 2;
    
    // Construct query parameters - TomTom requires point and zoom level
    const params = new URLSearchParams({
      key: apiKey,
      point: `${centerLat},${centerLng}`, // Center point of Hyderabad
      zoom: '10', // City-level zoom
      unit: 'KMPH',
      style: 'absolute',
      maxSpeedLimit: '150' // km/h
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log(`Fetching TomTom flow data from: ${baseUrl}${flowEndpoint}?${params.toString()}`);
    
    const response = await fetch(`${baseUrl}${flowEndpoint}?${params.toString()}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("TomTom flow data received:", data);
    
    // Transform TomTom API data to our application's data model
    const vehicles = transformTomTomVehicleData(data);
    const congestion = transformTomTomCongestionData(data);

    console.log(`Transformed ${vehicles.length} vehicles and ${congestion.length} congestion zones`);
    return { vehicles, congestion };
  } catch (error) {
    console.error('Error fetching TomTom traffic flow data:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "TomTom API Request Timeout",
        description: "The request to the TomTom Traffic API timed out. Using fallback data instead.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Traffic Data Error",
        description: "Could not fetch traffic data from TomTom API. Using fallback data instead.",
        variant: "destructive",
      });
    }
    
    // Return empty arrays so the application can continue
    return { vehicles: [], congestion: [] };
  }
}

/**
 * Fetches traffic incidents/anomalies from TomTom Traffic API
 */
export async function fetchTomTomTrafficIncidents(): Promise<Anomaly[]> {
  // Check if TomTom API is enabled
  if (!API_PROVIDERS.tomtom.enabled) {
    console.warn('TomTom Traffic API is not configured');
    return [];
  }

  // Apply rate limiting
  await rateLimiter.throttle();

  try {
    const { baseUrl, incidentEndpoint, apiKey, timeout } = API_PROVIDERS.tomtom;
    
    // For incidents we need to format the parameters correctly
    const centerLat = (HYDERABAD_BOUNDING_BOX.north + HYDERABAD_BOUNDING_BOX.south) / 2;
    const centerLng = (HYDERABAD_BOUNDING_BOX.east + HYDERABAD_BOUNDING_BOX.west) / 2;
    
    // Updated query parameters to match TomTom's requirements
    const params = new URLSearchParams({
      key: apiKey,
      position: `${centerLat},${centerLng}`,
      radius: "20000", // 20km radius
      language: 'en-GB',
      categoryFilter: '0,1,2,3,4,5,6,7,8,9,10,11', // All categories
      expandCluster: 'true',
      timeValidityFilter: 'present'
    });

    console.log(`Fetching TomTom incidents from: ${baseUrl}${incidentEndpoint}?${params.toString()}`);
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${baseUrl}${incidentEndpoint}?${params.toString()}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`TomTom API error: ${response.status} ${response.statusText}`);
      // Instead of throwing, we'll return empty array in case of API errors
      return [];
    }

    const data = await response.json();
    console.log("TomTom incidents data received:", data);
    
    // Transform TomTom API incident data to our application's anomaly model
    const anomalies = transformTomTomAnomalyData(data);
    console.log(`Transformed ${anomalies.length} anomalies from TomTom data`);
    return anomalies;
  } catch (error) {
    console.error('Error fetching TomTom traffic incidents:', error);
    
    // Show user-friendly error notification
    if (error instanceof Error && error.name === 'AbortError') {
      toast({
        title: "TomTom API Request Timeout",
        description: "The request to the TomTom Traffic Incidents API timed out. Using fallback data.",
        variant: "destructive",
      });
    }
    
    // Return empty array instead of throwing
    return [];
  }
}
