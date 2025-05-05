
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";

/**
 * Fetches vehicle data from the API
 */
export async function fetchVehicles(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("vehicles", options);
  } catch (error) {
    console.error("Error fetching vehicles from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("vehicles", options);
  }
}
