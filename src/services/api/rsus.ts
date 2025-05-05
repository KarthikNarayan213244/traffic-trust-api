
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";

/**
 * Fetches RSU (Roadside Unit) data from the API
 */
export async function fetchRSUs(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("rsus", options);
  } catch (error) {
    console.error("Error fetching RSUs from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("rsus", options);
  }
}

/**
 * Generates mock RSU data for testing and development
 */
export function getMockRSUs(): any[] {
  return [
    {
      id: "rsu1",
      rsu_id: "RSU-001",
      location: "Hitec City Junction",
      status: "Active",
      coverage_radius: 500,
      lat: 17.4485,
      lng: 78.3772,
      last_seen: new Date().toISOString()
    },
    {
      id: "rsu2",
      rsu_id: "RSU-002",
      location: "Gachibowli Junction",
      status: "Active",
      coverage_radius: 600,
      lat: 17.4400,
      lng: 78.3489,
      last_seen: new Date().toISOString()
    },
    {
      id: "rsu3",
      rsu_id: "RSU-003",
      location: "Madhapur Signal",
      status: "Inactive",
      coverage_radius: 450,
      lat: 17.4501,
      lng: 78.3915,
      last_seen: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];
}
