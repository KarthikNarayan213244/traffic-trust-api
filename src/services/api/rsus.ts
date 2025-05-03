
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { RSU } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchRSUs(options = {}): Promise<RSU[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase<"rsus">("rsus", options);
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
export const getMockRSUs = (): RSU[] => [
  { rsu_id: "RSU-1001", location: { lat: 17.4435, lng: 78.3772 }, lat: 17.4435, lng: 78.3772, status: "Active", coverage_radius: 500 },
  { rsu_id: "RSU-1002", location: { lat: 17.4401, lng: 78.3489 }, lat: 17.4401, lng: 78.3489, status: "Active", coverage_radius: 800 },
  { rsu_id: "RSU-1003", location: { lat: 17.4156, lng: 78.4347 }, lat: 17.4156, lng: 78.4347, status: "Inactive", coverage_radius: 600 },
  { rsu_id: "RSU-1004", location: { lat: 17.4399, lng: 78.4983 }, lat: 17.4399, lng: 78.4983, status: "Active", coverage_radius: 700 }
];
