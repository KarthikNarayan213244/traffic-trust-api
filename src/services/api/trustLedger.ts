
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { TrustLedgerEntry } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchTrustLedger(options = {}): Promise<TrustLedgerEntry[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase<"trustLedger">("trustLedger", options);
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
  {
    id: "1",
    timestamp: "2025-04-28T10:15:23Z",
    vehicle_id: "TS08-1234-AB",
    old_score: 85,
    new_score: 87,
    change: 2,
    reason: "Consistent speed compliance",
    tx_id: "0x1a2b3c4d5e6f",
    action: "TRUST_INCREASE",
    old_value: 85,
    new_value: 87,
    details: "Vehicle maintained legal speed in congestion zone"
  },
  {
    id: "2",
    timestamp: "2025-04-28T09:45:11Z",
    vehicle_id: "TS08-5678-CD",
    old_score: 92,
    new_score: 88,
    change: -4,
    reason: "Signal violation",
    tx_id: "0x2b3c4d5e6f7g",
    action: "TRUST_DECREASE",
    old_value: 92,
    new_value: 88,
    details: "Vehicle ran red light at intersection"
  },
  {
    id: "3",
    timestamp: "2025-04-28T08:30:45Z",
    vehicle_id: "TS07-9012-EF",
    old_score: 78,
    new_score: 75,
    change: -3,
    reason: "Lane discipline violation",
    tx_id: "0x3c4d5e6f7g8h",
    action: "TRUST_DECREASE",
    old_value: 78,
    new_value: 75,
    details: "Improper lane change without signal"
  },
  {
    id: "4",
    timestamp: "2025-04-28T07:15:33Z",
    vehicle_id: "TS09-3456-GH",
    old_score: 80,
    new_score: 85,
    change: 5,
    reason: "Emergency vehicle yield",
    tx_id: "0x4d5e6f7g8h9i",
    action: "TRUST_INCREASE",
    old_value: 80,
    new_value: 85,
    details: "Properly yielded to emergency vehicle"
  },
  {
    id: "5",
    timestamp: "2025-04-27T18:20:14Z",
    vehicle_id: "TS08-7890-IJ",
    old_score: 76,
    new_score: 73,
    change: -3,
    reason: "Unsafe following distance",
    tx_id: "0x5e6f7g8h9i0j",
    action: "TRUST_DECREASE",
    old_value: 76,
    new_value: 73,
    details: "Tailgating in high traffic condition"
  },
  {
    id: "6",
    timestamp: "2025-04-27T15:10:09Z",
    vehicle_id: "TS07-1234-KL",
    old_score: 81,
    new_score: 86,
    change: 5,
    reason: "Pedestrian yielding",
    tx_id: "0x6f7g8h9i0j1k",
    action: "TRUST_INCREASE",
    old_value: 81,
    new_value: 86,
    details: "Proper yielding to pedestrians at crosswalk"
  },
  {
    id: "7",
    timestamp: "2025-04-27T12:05:56Z",
    vehicle_id: "TS09-5678-MN",
    old_score: 89,
    new_score: 91,
    change: 2,
    reason: "Speed compliance",
    tx_id: "0x7g8h9i0j1k2l",
    action: "TRUST_INCREASE",
    old_value: 89,
    new_value: 91,
    details: "Consistent adherence to speed limits"
  },
  {
    id: "8",
    timestamp: "2025-04-27T09:30:42Z",
    vehicle_id: "TS08-9012-OP",
    old_score: 93,
    new_score: 90,
    change: -3,
    reason: "No-parking zone violation",
    tx_id: "0x8h9i0j1k2l3m",
    action: "TRUST_DECREASE",
    old_value: 93,
    new_value: 90,
    details: "Parked in no-parking zone during peak hours"
  }
];
