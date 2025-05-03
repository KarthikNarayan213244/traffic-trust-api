
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Anomaly } from "./types";
import { ApiEndpoint } from "./config";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

// Fetch anomalies with real-time API support
export async function fetchAnomalies(options = {}): Promise<Anomaly[]> {
  try {
    // First try to use real-time traffic API if configured
    if (isRealTimeDataAvailable()) {
      try {
        const realTimeData = await fetchRealTimeTrafficData();
        if (realTimeData.anomalies && realTimeData.anomalies.length > 0) {
          console.log(`Fetched ${realTimeData.anomalies.length} anomalies from real-time API`);
          return realTimeData.anomalies;
        }
      } catch (realTimeError) {
        console.error("Error fetching anomalies from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    }

    // Then try to fetch from Supabase
    try {
      const data = await fetchFromSupabase<"anomalies">("anomalies", options);
      return data;
    } catch (error) {
      console.error("Error fetching anomalies from Supabase:", error);
      // Fallback to direct API or mock data
    }

    // Fallback to direct API
    try {
      return await fetchData("anomalies", options);
    } catch (apiError) {
      console.error("Error fetching anomalies from API:", apiError);
      return getMockAnomalies();
    }
  } catch (error) {
    console.error("All anomaly data sources failed:", error);
    return getMockAnomalies();
  }
}

// Mock data for anomalies
export function getMockAnomalies(): Anomaly[] {
  return [
    { 
      id: "1", 
      timestamp: new Date().toISOString(), 
      vehicle_id: "TS08-1234-AB", 
      type: "Speed Violation", 
      severity: "High", 
      message: "Vehicle exceeded speed limit by 30km/h",
      status: "Detected",
      ml_confidence: 0.95
    },
    { 
      id: "2", 
      timestamp: new Date().toISOString(), 
      vehicle_id: "TS07-5678-CD", 
      type: "Signal Tampering", 
      severity: "Critical", 
      message: "Unusual signal pattern detected from vehicle transponder",
      status: "Detected",
      ml_confidence: 0.88
    },
    { 
      id: "3", 
      timestamp: new Date().toISOString(), 
      vehicle_id: "TS09-9012-EF", 
      type: "Erratic Driving Pattern", 
      severity: "Medium", 
      message: "Vehicle performed 3 unexpected lane changes in quick succession",
      status: "Detected",
      ml_confidence: 0.91
    },
    { 
      id: "4", 
      timestamp: new Date().toISOString(), 
      vehicle_id: "TS10-3456-GH", 
      type: "Traffic Signal Violation", 
      severity: "Medium", 
      message: "Vehicle crossed intersection during red signal phase",
      status: "Resolved",
      ml_confidence: 0.93
    }
  ];
}
