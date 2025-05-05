
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";

/**
 * Fetches anomaly data from the API
 */
export async function fetchAnomalies(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("anomalies", options);
  } catch (error) {
    console.error("Error fetching anomalies from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("anomalies", options);
  }
}
