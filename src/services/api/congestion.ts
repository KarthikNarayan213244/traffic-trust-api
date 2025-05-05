
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";

/**
 * Fetches congestion data from the API
 */
export async function fetchCongestionData(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("congestion", options);
  } catch (error) {
    console.error("Error fetching congestion data from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("congestion", options);
  }
}

/**
 * Generates mock congestion zone data for testing and development
 */
export function getMockCongestionZones(): any[] {
  return [
    {
      id: "c1",
      zone_name: "Hitec City",
      lat: 17.4485,
      lng: 78.3772,
      congestion_level: 8,
      updated_at: new Date().toISOString()
    },
    {
      id: "c2",
      zone_name: "Gachibowli",
      lat: 17.4400,
      lng: 78.3489,
      congestion_level: 6,
      updated_at: new Date().toISOString()
    },
    {
      id: "c3",
      zone_name: "Madhapur",
      lat: 17.4501,
      lng: 78.3915,
      congestion_level: 4,
      updated_at: new Date().toISOString()
    },
    {
      id: "c4",
      zone_name: "Banjara Hills",
      lat: 17.4236,
      lng: 78.4255,
      congestion_level: 7,
      updated_at: new Date().toISOString()
    }
  ];
}
