
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

/**
 * Generates mock trust ledger data for testing and development
 */
export function getMockTrustLedger(): any[] {
  return [
    {
      id: "t1",
      vehicle_id: "HYD-1234",
      action: "Score Update",
      old_value: 90,
      new_value: 95,
      details: "Regular trusted behavior",
      tx_id: "0x1234567890abcdef1234567890abcdef12345678",
      timestamp: new Date().toISOString()
    },
    {
      id: "t2",
      vehicle_id: "HYD-5678",
      action: "Score Decrease",
      old_value: 92,
      new_value: 87,
      details: "Mild traffic violation",
      tx_id: "0xabcdef1234567890abcdef1234567890abcdef12",
      timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: "t3",
      vehicle_id: "HYD-9012",
      action: "Major Penalty",
      old_value: 85,
      new_value: 76,
      details: "Authentication failure with multiple RSUs",
      tx_id: "0x7890abcdef1234567890abcdef1234567890abcd",
      timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
  ];
}
