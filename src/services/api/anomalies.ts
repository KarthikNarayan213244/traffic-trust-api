
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Anomaly } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchAnomalies(options = {}): Promise<Anomaly[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase<"anomalies">("anomalies", options);
    return data;
  } catch (error) {
    console.error("Error fetching anomalies from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      return await fetchData("anomalies", options);
    } catch (apiError) {
      console.error("Error fetching anomalies from API:", apiError);
      return getMockAnomalies();
    }
  }
}

// Mock data for anomalies
export const getMockAnomalies = (): Anomaly[] => [
  { id: 1, timestamp: "2025-04-28T10:05:00Z", type: "Speed Violation", severity: "High", vehicle_id: "TS08-5678-CD", message: "Speed limit violation detected" },
  { id: 2, timestamp: "2025-04-28T09:15:00Z", type: "Signal Tampering", severity: "Critical", vehicle_id: "TS08-1234-GH", message: "Suspicious signal activity detected" },
  { id: 3, timestamp: "2025-04-28T08:30:00Z", type: "Unauthorized Access", severity: "Medium", vehicle_id: "TS07-2345-AB", message: "Security breach attempt" },
  { id: 4, timestamp: "2025-04-27T22:45:00Z", type: "GPS Spoofing", severity: "High", vehicle_id: "TS09-1010-XY", message: "Location spoofing attempt" }
];
