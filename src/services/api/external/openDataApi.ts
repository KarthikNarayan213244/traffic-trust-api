
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
    // Request significantly more data records
    url.searchParams.append('limit', '5000');  // Increased from 1000 to 5000
    url.searchParams.append('offset', '0');
    url.searchParams.append('include_all', 'true'); // Try to get all data if API supports it
    
    console.log('Fetching OpenData traffic data from:', url.toString());
    
    // Create a controller to handle timeout manually
    const controller = new AbortController();
    const { timeout } = API_PROVIDERS.opendata;
    
    // Set up timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Fetch data from OpenData API without passing timeout to fetch directly
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : ''
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`OpenData API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('OpenData API response received:', data.count || data.length || 'unknown count');
      
      // If pagination is available, fetch more data
      let allData = data;
      if (data.offset !== undefined && data.limit !== undefined && data.total !== undefined) {
        const totalRecords = data.total;
        const recordsPerPage = data.limit;
        const pages = Math.min(10, Math.ceil(totalRecords / recordsPerPage)); // Limit to 10 pages max
        
        console.log(`API supports pagination. Fetching up to ${pages} pages of data.`);
        
        // Start from page 1 since we already have page 0
        const additionalRequests = [];
        for (let page = 1; page < pages; page++) {
          const pageUrl = new URL(url.toString());
          pageUrl.searchParams.set('offset', (page * recordsPerPage).toString());
          
          additionalRequests.push(
            fetch(pageUrl.toString(), {
              headers: {
                'Accept': 'application/json',
                'Authorization': apiKey ? `Bearer ${apiKey}` : ''
              }
            }).then(res => res.json())
          );
        }
        
        if (additionalRequests.length > 0) {
          // Fetch additional pages in parallel
          const additionalResults = await Promise.all(additionalRequests);
          
          // Combine all data
          allData.data = allData.data || [];
          additionalResults.forEach(result => {
            if (result.data && Array.isArray(result.data)) {
              allData.data = allData.data.concat(result.data);
            }
          });
          
          console.log(`Combined data from ${additionalResults.length + 1} pages, total records: ${allData.data.length}`);
        }
      }
      
      // Transform data using our utility function
      const transformedData = transformOpenDataTraffic(allData);
      console.log(`Transformed OpenData traffic: ${transformedData.vehicles.length} vehicles, ${transformedData.congestion.length} congestion zones, ${transformedData.anomalies.length} anomalies`);
      
      return transformedData;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching data from OpenData API:', error);
    return {
      vehicles: [],
      congestion: [],
      anomalies: []
    };
  }
}
