
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";

/**
 * Fetches trust ledger data from the API
 */
export async function fetchTrustLedger(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("trustLedger", options);
  } catch (error) {
    console.error("Error fetching trust ledger from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("trustLedger", options);
  }
}
