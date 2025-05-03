
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { CongestionZone } from "./types";
import { ApiEndpoint } from "./config";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

// Renamed function to match import expectations across the app
export async function fetchCongestionData(options = {}): Promise<CongestionZone[]> {
  try {
    // First try to use real-time traffic API if configured
    if (isRealTimeDataAvailable()) {
      try {
        const realTimeData = await fetchRealTimeTrafficData();
        if (realTimeData.congestion && realTimeData.congestion.length > 0) {
          console.log(`Fetched ${realTimeData.congestion.length} congestion zones from real-time API`);
          return realTimeData.congestion;
        }
      } catch (realTimeError) {
        console.error("Error fetching congestion from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    }
    
    // Then try to fetch from Supabase
    try {
      const data = await fetchFromSupabase<"congestion">("congestion", options);
      return data;
    } catch (error) {
      console.error("Error fetching congestion zones from Supabase:", error);
      // Fallback to direct API or mock data
    }

    // Fallback to direct API
    try {
      return await fetchData("congestion", options);
    } catch (apiError) {
      console.error("Error fetching congestion zones from API:", apiError);
      return getMockCongestionZones();
    }
  } catch (error) {
    console.error("All congestion data sources failed:", error);
    return getMockCongestionZones();
  }
}

// Keep the original function name for backward compatibility
export async function fetchCongestionZones(options = {}): Promise<CongestionZone[]> {
  return fetchCongestionData(options);
}

// Mock data for congestion zones
export function getMockCongestionZones(): CongestionZone[] {
  return [
    { id: "1", zone_name: "Hitech City Junction", lat: 17.4479, lng: 78.3762, congestion_level: 8, updated_at: new Date().toISOString() },
    { id: "2", zone_name: "Madhapur", lat: 17.4400, lng: 78.3900, congestion_level: 6, updated_at: new Date().toISOString() },
    { id: "3", zone_name: "Gachibowli", lat: 17.4410, lng: 78.3490, congestion_level: 7, updated_at: new Date().toISOString() },
    { id: "4", zone_name: "KPHB", lat: 17.4840, lng: 78.3920, congestion_level: 5, updated_at: new Date().toISOString() },
  ];
}
