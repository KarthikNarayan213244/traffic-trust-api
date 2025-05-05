
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
