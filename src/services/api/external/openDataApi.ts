
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
    
    // Construct the API URL with parameters
    const url = new URL(baseUrl);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('bbox', `${HYDERABAD_BOUNDING_BOX.west},${HYDERABAD_BOUNDING_BOX.south},${HYDERABAD_BOUNDING_BOX.east},${HYDERABAD_BOUNDING_BOX.north}`);
    
    // Fetch data from OpenData API
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : ''
      },
      timeout: API_PROVIDERS.opendata.timeout
    });
    
    if (!response.ok) {
      throw new Error(`OpenData API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform data using our utility function
    return transformOpenDataTraffic(data);
  } catch (error) {
    console.error('Error fetching data from OpenData API:', error);
    return {
      vehicles: [],
      congestion: [],
      anomalies: []
    };
  }
}
