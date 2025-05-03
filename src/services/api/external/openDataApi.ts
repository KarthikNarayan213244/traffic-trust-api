
import { API_PROVIDERS, HYDERABAD_BOUNDING_BOX } from './config';
import { transformOpenDataTraffic } from './transformers';
import { Vehicle, CongestionZone, Anomaly } from '../types';

/**
 * Fetches traffic data from Open Data APIs
 * These could be government or municipal traffic APIs with open access
 */
export async function fetchOpenDataTraffic(): Promise<{
  vehicles: Vehicle[];
  congestion: CongestionZone[];
  anomalies: Anomaly[];
}> {
  // Check if Open Data API is enabled
  if (!API_PROVIDERS.opendata.enabled) {
    console.log('OpenData API is not configured, using mock data');
    return {
      vehicles: [],
      congestion: [],
      anomalies: []
    };
  }

  try {
    const { baseUrl, apiKey } = API_PROVIDERS.opendata;
    
    // Construct the API URL with parameters for maximum data
    const url = new URL(baseUrl);
    url.searchParams.append('api-key', apiKey);
    url.searchParams.append('format', 'json');
    // Add bbox parameter in format required by API
    url.searchParams.append('bbox', `${HYDERABAD_BOUNDING_BOX.west},${HYDERABAD_BOUNDING_BOX.south},${HYDERABAD_BOUNDING_BOX.east},${HYDERABAD_BOUNDING_BOX.north}`);
    // Request more data records
    url.searchParams.append('limit', '1000');
    url.searchParams.append('offset', '0');
    
    console.log('Fetching OpenData traffic data from:', url.toString());
    
    // Fetch data from OpenData API
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : ''
      }
      // Timeout is handled separately, not in fetch API
    });
    
    if (!response.ok) {
      throw new Error(`OpenData API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('OpenData API response received:', data.count || 'unknown count');
    
    // Transform data using our utility function
    const transformedData = transformOpenDataTraffic(data);
    console.log(`Transformed OpenData traffic: ${transformedData.vehicles.length} vehicles, ${transformedData.congestion.length} congestion zones, ${transformedData.anomalies.length} anomalies`);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching data from OpenData API:', error);
    return {
      vehicles: [],
      congestion: [],
      anomalies: []
    };
  }
}
