import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { CongestionZone } from "./types";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

// Renamed function to match import expectations across the app
export async function fetchCongestionData(options = {}): Promise<CongestionZone[]> {
  try {
    // Always try to use real-time traffic API first
    if (isRealTimeDataAvailable()) {
      try {
        console.log("Attempting to fetch congestion data from real-time traffic API...");
        const realTimeData = await fetchRealTimeTrafficData();
        
        if (realTimeData.congestion && realTimeData.congestion.length > 0) {
          console.log(`Successfully fetched ${realTimeData.congestion.length} congestion zones from real-time API`);
          return realTimeData.congestion;
        } else {
          console.log("Real-time API returned no congestion data, falling back to other sources");
        }
      } catch (realTimeError) {
        console.error("Error fetching congestion from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    } else {
      console.log("Real-time data sources not available, falling back to database");
    }
    
    // Then try to fetch from Supabase
    try {
      console.log("Attempting to fetch congestion data from Supabase...");
      const data = await fetchFromSupabase<"congestion">("congestion", options);
      if (data.length > 0) {
        console.log(`Successfully fetched ${data.length} congestion zones from Supabase`);
        return data;
      }
    } catch (error) {
      console.error("Error fetching congestion zones from Supabase:", error);
    }

    // Fallback to direct API
    try {
      console.log("Attempting to fetch congestion data from direct API...");
      const apiData = await fetchData("congestion", options);
      if (apiData.length > 0) {
        console.log(`Successfully fetched ${apiData.length} congestion zones from direct API`);
        return apiData;
      }
    } catch (apiError) {
      console.error("Error fetching congestion zones from API:", apiError);
    }
    
    console.log("All data sources failed, using mock data");
    return getMockCongestionZones();
  } catch (error) {
    console.error("All congestion data sources failed:", error);
    return getMockCongestionZones();
  }
}

// Keep the original function name for backward compatibility
export async function fetchCongestionZones(options = {}): Promise<CongestionZone[]> {
  return fetchCongestionData(options);
}

// Mock data for congestion zones - now used only as a last resort
export function getMockCongestionZones(): CongestionZone[] {
  return [
    { id: "1", zone_name: "Hitech City Junction", lat: 17.4479, lng: 78.3762, congestion_level: 8, updated_at: new Date().toISOString() },
    { id: "2", zone_name: "Madhapur", lat: 17.4400, lng: 78.3900, congestion_level: 6, updated_at: new Date().toISOString() },
    { id: "3", zone_name: "Gachibowli", lat: 17.4410, lng: 78.3490, congestion_level: 7, updated_at: new Date().toISOString() },
    { id: "4", zone_name: "KPHB", lat: 17.4840, lng: 78.3920, congestion_level: 5, updated_at: new Date().toISOString() },
  ];
}
