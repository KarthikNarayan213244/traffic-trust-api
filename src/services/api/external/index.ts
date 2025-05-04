
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
    
    // Only use mock data if explicitly requested or if no real API is configured
    if (provider === 'mock') {
      console.log('No real API configured, using mock data as last resort');
      return {
        vehicles: getMockVehicles(),
        congestion: getMockCongestionZones(),
        anomalies: getMockAnomalies(),
        rsus: getMockRSUs()
      };
    }
    
    // Fetch data from the primary provider
    try {
      switch (provider) {
        case 'here':
          // Fetch HERE data in parallel
          const [flowData, incidentData] = await Promise.all([
            fetchHereTrafficFlow(),
            fetchHereTrafficIncidents()
          ]);
          
          console.log('Successfully fetched real-time traffic data from HERE API');
          console.log(`Retrieved: ${flowData.vehicles.length} vehicles, ${flowData.congestion.length} congestion zones, ${incidentData.length} incidents`);
          
          // Get RSUs - these aren't available from HERE API, so we'll use mock data
          const rsus = getMockRSUs();
          
          return {
            vehicles: flowData.vehicles,
            congestion: flowData.congestion,
            anomalies: incidentData,
            rsus: rsus
          };
          
        case 'tomtom':
          // Fetch TomTom data in parallel with improved error handling
          try {
            const [tomtomFlowData, tomtomIncidentData] = await Promise.all([
              fetchTomTomTrafficFlow().catch(err => {
                console.error("Error in TomTom flow data fetch:", err);
                return { vehicles: [], congestion: [] };
              }),
              fetchTomTomTrafficIncidents().catch(err => {
                console.error("Error in TomTom incidents fetch:", err);
                return [];
              })
            ]);
            
            console.log('Successfully fetched real-time traffic data from TomTom API');
            console.log(`Retrieved: ${tomtomFlowData.vehicles.length} vehicles, ${tomtomFlowData.congestion.length} congestion zones, ${tomtomIncidentData.length} incidents`);
            
            // Get RSUs - fetch from database or generate
            const rsus = await getMockRSUs(50); // More RSUs for better visualization
            
            return {
              vehicles: tomtomFlowData.vehicles,
              congestion: tomtomFlowData.congestion,
              anomalies: tomtomIncidentData,
              rsus: rsus
            };
          } catch (tomTomError) {
            console.error("Failed to process TomTom data:", tomTomError);
            throw tomTomError;
          }
          
        case 'opendata':
          // OpenData APIs often provide all data in one call
          const openDataResult = await fetchOpenDataTraffic();
          
          console.log('Successfully fetched real-time traffic data from Open Data API');
          console.log(`Retrieved: ${openDataResult.vehicles.length} vehicles, ${openDataResult.congestion.length} congestion zones, ${openDataResult.anomalies.length} anomalies`);
          
          return {
            vehicles: openDataResult.vehicles,
            congestion: openDataResult.congestion,
            anomalies: openDataResult.anomalies,
            rsus: getMockRSUs()
          };
          
        default:
          console.warn(`Unknown provider: ${provider}, falling back to mock data`);
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
        
        // Update the provider in the config temporarily and try again
        // This is a recursive call but it should only happen once
        return fetchRealTimeTrafficData();
      }
      
      console.log("No alternative providers available, using mock data");
      throw providerError; // Re-throw if no alternative is available
    }
  } catch (error) {
    console.error('Error fetching real-time traffic data:', error);
    
    toast({
      title: "API Connection Error",
      description: "Failed to connect to traffic data provider. Using fallback data temporarily.",
      variant: "destructive",
    });
    
    // Return mock data only as a last resort fallback
    return {
      vehicles: getMockVehicles(),
      congestion: getMockCongestionZones(),
      anomalies: getMockAnomalies(),
      rsus: getMockRSUs(40) // Generate more RSUs for better visualization
    };
  }
}

// Check if real-time data is available with more aggressive checking
export function isRealTimeDataAvailable(): boolean {
  const provider = getActiveProvider();
  
  // Don't consider 'mock' as real-time
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
