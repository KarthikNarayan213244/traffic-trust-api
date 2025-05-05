import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { CongestionZone } from "./types";
import { ApiEndpoint } from "./supabase/types";

// Renamed function to match import expectations across the app
export async function fetchCongestionData(options = {}): Promise<CongestionZone[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("congestion", options);
    return data;
  } catch (error) {
    console.error("Error fetching congestion zones from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      return await fetchData("congestion", options);
    } catch (apiError) {
      console.error("Error fetching congestion zones from API:", apiError);
      return getMockCongestionZones();
    }
  }
}

// Keep the original function name for backward compatibility
export async function fetchCongestionZones(options = {}): Promise<CongestionZone[]> {
  return fetchCongestionData(options);
}

// Mock data for congestion zones
export function getMockCongestionZones(): CongestionZone[] {
  return [
    { id: 1, zone_name: "Hitech City Junction", lat: 17.4479, lng: 78.3762, congestion_level: 8, updated_at: new Date().toISOString() },
    { id: 2, zone_name: "Madhapur", lat: 17.4400, lng: 78.3900, congestion_level: 6, updated_at: new Date().toISOString() },
    { id: 3, zone_name: "Gachibowli", lat: 17.4410, lng: 78.3490, congestion_level: 7, updated_at: new Date().toISOString() },
    { id: 4, zone_name: "KPHB", lat: 17.4840, lng: 78.3920, congestion_level: 5, updated_at: new Date().toISOString() },
  ];
}
