
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";
import { supabase } from "@/integrations/supabase/client";

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
 * Create a new anomaly
 */
export async function createAnomaly(anomaly: any): Promise<any> {
  try {
    // Ensure ID is present
    if (!anomaly.id) {
      anomaly.id = `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Ensure timestamp is present
    if (!anomaly.timestamp) {
      anomaly.timestamp = new Date().toISOString();
    }
    
    // Add default values if not provided
    if (!anomaly.status) {
      anomaly.status = 'Detected';
    }
    
    // Insert using Supabase client
    const { data, error } = await supabase
      .from('anomalies')
      .insert(anomaly)
      .select();
    
    if (error) {
      console.error("Error creating anomaly:", error);
      throw error;
    }
    
    return data?.[0] || anomaly;
  } catch (error) {
    console.error("Error creating anomaly:", error);
    throw error;
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
    },
    {
      id: "a4",
      type: "Sybil Attack",
      timestamp: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      message: "Sybil attack detected on RSU-001",
      status: "Detected",
      severity: "High",
      target_id: "RSU-001",
      target_type: "RSU"
    },
    {
      id: "a5",
      type: "Denial of Service",
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      message: "DoS attack detected on RSU-002",
      status: "Mitigated",
      severity: "Critical",
      target_id: "RSU-002",
      target_type: "RSU"
    }
  ];
}
