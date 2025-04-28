
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { TrustLedgerEntry } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchTrustLedger(options = {}): Promise<TrustLedgerEntry[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("trustLedger" as ApiEndpoint, options);
    return data;
  } catch (error) {
    console.error("Error fetching trust ledger from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      return await fetchData("trustLedger", options);
    } catch (apiError) {
      console.error("Error fetching trust ledger from API:", apiError);
      return getMockTrustLedger();
    }
  }
}

// Mock data for trust ledger
export const getMockTrustLedger = (): TrustLedgerEntry[] => [
  { tx_id: "TX123456", timestamp: "2025-04-28T10:30:00Z", vehicle_id: "TS07-2345-AB", action: "Trust Score Update", old_value: 90, new_value: 95 },
  { tx_id: "TX123457", timestamp: "2025-04-28T09:45:00Z", vehicle_id: "TS08-5678-CD", action: "Trust Score Update", old_value: 95, new_value: 88 },
  { tx_id: "TX123458", timestamp: "2025-04-28T08:15:00Z", vehicle_id: "TS08-1234-GH", action: "Trust Score Update", old_value: 85, new_value: 75 },
  { tx_id: "TX123459", timestamp: "2025-04-28T07:30:00Z", vehicle_id: "TS09-1010-XY", action: "Trust Score Update", old_value: 89, new_value: 92 }
];
