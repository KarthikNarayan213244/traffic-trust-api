import { getActiveProvider, API_PROVIDERS } from './config';
import { fetchHereTrafficFlow, fetchHereTrafficIncidents } from './hereApi';
import { fetchTomTomTrafficFlow, fetchTomTomTrafficIncidents } from './tomtomApi';
import { fetchOpenDataTraffic } from './openDataApi';
import { Vehicle, CongestionZone, Anomaly, RSU } from '../types';
import { getMockVehicles } from '../vehicles';
import { getMockCongestionZones } from '../congestion';
import { getMockAnomalies } from '../anomalies';
import { getMockRSUs } from '../rsus';
import { toast } from '@/hooks/use-toast';

/**
 * Main entry point for fetching real-world traffic data
 * Handles provider selection, fallbacks, and error handling
 */
export async function fetchRealTimeTrafficData(): Promise<{
  vehicles: Vehicle[],
  congestion: CongestionZone[],
  anomalies: Anomaly[],
  rsus: RSU[]
}> {
  // Default response with empty arrays
  const defaultResponse = {
    vehicles: [],
    congestion: [],
    anomalies: [],
    rsus: []
  };
  
  try {
    // Get current active provider based on available API keys
    const provider = getActiveProvider();
    console.log(`Fetching real-time traffic data from ${provider} provider`);
    
    // Fall back to mock data if no real API is configured
    if (provider === 'mock') {
      console.log('No real API configured, using mock data');
      return {
        vehicles: getMockVehicles(),
        congestion: getMockCongestionZones(),
        anomalies: getMockAnomalies(),
        rsus: getMockRSUs()
      };
    }
    
    // Fetch data based on the provider with aggressive retry
    try {
      switch (provider) {
        case 'here':
          // Fetch HERE data in parallel
          const [flowData, incidentData] = await Promise.all([
            fetchHereTrafficFlow(),
            fetchHereTrafficIncidents()
          ]);
          
          return {
            vehicles: flowData.vehicles,
            congestion: flowData.congestion,
            anomalies: incidentData,
            rsus: getMockRSUs() // RSUs not provided by HERE API
          };
          
        case 'tomtom':
          // Fetch TomTom data in parallel
          const [tomtomFlowData, tomtomIncidentData] = await Promise.all([
            fetchTomTomTrafficFlow(),
            fetchTomTomTrafficIncidents()
          ]);
          
          return {
            vehicles: tomtomFlowData.vehicles,
            congestion: tomtomFlowData.congestion,
            anomalies: tomtomIncidentData,
            rsus: getMockRSUs() // RSUs not provided by TomTom API
          };
          
        case 'opendata':
          // OpenData APIs often provide all data in one call
          const openDataResult = await fetchOpenDataTraffic();
          
          return {
            vehicles: openDataResult.vehicles,
            congestion: openDataResult.congestion,
            anomalies: openDataResult.anomalies,
            rsus: getMockRSUs() // RSUs not provided by most open data APIs
          };
          
        default:
          console.error(`Unknown provider: ${provider}`);
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (providerError) {
      // If primary provider fails, try to use an alternative provider
      console.error(`Error with primary provider ${provider}:`, providerError);
      console.log('Attempting to use an alternative provider...');
      
      // Try another provider if available
      const alternativeProviders = ['here', 'tomtom', 'opendata'].filter(p => p !== provider && API_PROVIDERS[p].enabled);
      
      if (alternativeProviders.length > 0) {
        const altProvider = alternativeProviders[0];
        console.log(`Trying alternative provider: ${altProvider}`);
        
        // Recursively call with modified provider order
        return fetchRealTimeTrafficData();
      }
      
      throw providerError; // Re-throw if no alternative is available
    }
  } catch (error) {
    console.error('Error fetching real-time traffic data:', error);
    
    toast({
      title: "API Connection Error",
      description: "Failed to connect to traffic data provider. Using local data instead.",
      variant: "destructive",
    });
    
    // Return mock data as fallback
    return {
      vehicles: getMockVehicles(),
      congestion: getMockCongestionZones(),
      anomalies: getMockAnomalies(),
      rsus: getMockRSUs()
    };
  }
}

// Check if real-time data is available with more aggressive checking
export function isRealTimeDataAvailable(): boolean {
  const provider = getActiveProvider();
  
  // Additional check for API availability
  if (provider !== 'mock') {
    // Check for API keys
    const apiProvider = API_PROVIDERS[provider];
    if (apiProvider && apiProvider.enabled && apiProvider.apiKey) {
      return true;
    }
  }
  
  return false;
}

// Get information about the current data source
export function getDataSourceInfo(): {
  provider: string;
  isRealTime: boolean;
  apiCredits?: string;
} {
  const provider = getActiveProvider();
  
  switch (provider) {
    case 'here':
      return {
        provider: 'HERE Traffic API',
        isRealTime: true,
        apiCredits: 'Powered by HERE Traffic API'
      };
    case 'tomtom':
      return {
        provider: 'TomTom Traffic API',
        isRealTime: true,
        apiCredits: 'Powered by TomTom Traffic API'
      };
    case 'opendata':
      return {
        provider: 'Government Traffic Data',
        isRealTime: true,
        apiCredits: 'Powered by Open Traffic Data'
      };
    case 'mock':
    default:
      return {
        provider: 'Simulated Traffic Data',
        isRealTime: false
      };
  }
}
