
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

// More realistic mock data for trust ledger
export const getMockTrustLedger = (): TrustLedgerEntry[] => [
  { tx_id: "0x7a23b5ef8742c16d3b6eb0b42128f69081592bad", timestamp: "2025-04-28T10:30:00Z", vehicle_id: "TS07-2345-AB", action: "Trust Score Update", old_value: 90, new_value: 95 },
  { tx_id: "0x5bf1c6dde8dc48c21799e23751b612acf4d6d93c", timestamp: "2025-04-28T09:45:00Z", vehicle_id: "TS08-5678-CD", action: "Trust Score Update", old_value: 95, new_value: 88 },
  { tx_id: "0x3a68e79bd21be41d93a0dd53a2f10fa8c6cef3d1", timestamp: "2025-04-28T08:15:00Z", vehicle_id: "TS08-1234-GH", action: "Trust Score Update", old_value: 85, new_value: 75 },
  { tx_id: "0x1e9c3d6e10c5b8fdc5282f292cdff074c7a54c76", timestamp: "2025-04-28T07:30:00Z", vehicle_id: "TS09-1010-XY", action: "Trust Score Update", old_value: 89, new_value: 92 },
  { tx_id: "0x8c7d25e5a31d7fa82c05b9c63f0c558105b142bd", timestamp: "2025-04-28T06:45:00Z", vehicle_id: "TS10-6789-JK", action: "Vehicle Registered", old_value: 0, new_value: 99 },
  { tx_id: "0x2f4d891ecd3a9e85ab1a8027e41f3ccfa93a96c2", timestamp: "2025-04-28T06:15:00Z", vehicle_id: "TS07-9876-EF", action: "Rule Violation", old_value: 98, new_value: 97 },
  { tx_id: "0xb92c7e62c4b8c8e012df0f1fd3da675e1e38257a", timestamp: "2025-04-28T05:45:00Z", vehicle_id: "TS11-9012-NO", action: "Trust Score Update", old_value: 79, new_value: 82 },
  { tx_id: "0x4e8f7acd16c3e890f499c6f9a713a59b4c5789c8", timestamp: "2025-04-28T05:00:00Z", vehicle_id: "TS14-1234-XY", action: "Trust Score Update", old_value: 82, new_value: 84 }
];
