
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
