
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Rsu } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchRSUs(options = {}): Promise<Rsu[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("rsus" as ApiEndpoint, options);
    return data;
  } catch (error) {
    console.error("Error fetching RSUs from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      return await fetchData("rsus", options);
    } catch (apiError) {
      console.error("Error fetching RSUs from API:", apiError);
      return getMockRSUs();
    }
  }
}

// Mock data for RSUs
export const getMockRSUs = (): Rsu[] => [
  { rsu_id: "RSU-1001", location: "Hitech City", status: "Active", coverage_radius: 500, lat: 17.4435, lng: 78.3772 },
  { rsu_id: "RSU-1002", location: "Gachibowli", status: "Active", coverage_radius: 800, lat: 17.4401, lng: 78.3489 },
  { rsu_id: "RSU-1003", location: "Banjara Hills", status: "Inactive", coverage_radius: 600, lat: 17.4156, lng: 78.4347 },
  { rsu_id: "RSU-1004", location: "Secunderabad", status: "Active", coverage_radius: 700, lat: 17.4399, lng: 78.4983 }
];
