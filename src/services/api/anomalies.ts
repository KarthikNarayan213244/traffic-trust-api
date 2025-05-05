
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

/**
 * Generates mock anomaly data for testing and development
 */
export function getMockAnomalies(): any[] {
  return [
    {
      id: "a1",
      type: "Speeding",
      timestamp: new Date().toISOString(),
      message: "Vehicle exceeded speed limit by 20 km/h",
      status: "Detected",
      severity: "Medium",
      vehicle_id: "HYD-1234"
    },
    {
      id: "a2",
      type: "Irregular Movement",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      message: "Vehicle made unexpected lane changes",
      status: "Verified",
      severity: "Low",
      vehicle_id: "HYD-5678"
    },
    {
      id: "a3",
      type: "Authentication Failure",
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      message: "Failed to authenticate with RSU",
      status: "Resolved",
      severity: "Critical",
      vehicle_id: "HYD-9012"
    }
  ];
}
