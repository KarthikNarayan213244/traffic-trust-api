
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { CongestionZone } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchCongestionData(options = {}): Promise<CongestionZone[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("congestion" as ApiEndpoint, options);
    return data;
  } catch (error) {
    console.error("Error fetching congestion data from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      return await fetchData("congestion", options);
    } catch (apiError) {
      console.error("Error fetching congestion data from API:", apiError);
      return getMockCongestion();
    }
  }
}

// Mock data for congestion zones
export const getMockCongestion = (): CongestionZone[] => [
  { id: 1, zone_name: "Hitech City", lat: 17.4435, lng: 78.3772, congestion_level: 8, updated_at: "2025-04-28T10:15:00Z" },
  { id: 2, zone_name: "Gachibowli", lat: 17.4401, lng: 78.3489, congestion_level: 5, updated_at: "2025-04-28T10:15:00Z" },
  { id: 3, zone_name: "Banjara Hills", lat: 17.4156, lng: 78.4347, congestion_level: 3, updated_at: "2025-04-28T10:15:00Z" },
  { id: 4, zone_name: "Secunderabad", lat: 17.4399, lng: 78.4983, congestion_level: 6, updated_at: "2025-04-28T10:15:00Z" }
];
