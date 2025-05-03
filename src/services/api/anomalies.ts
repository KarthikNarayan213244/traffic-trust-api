
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Anomaly } from "./types";
import { ApiEndpoint } from "./config";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

// Fetch anomalies with real-time API support
export async function fetchAnomalies(options = {}): Promise<Anomaly[]> {
  try {
    // Always try to use real-time traffic API first
    if (isRealTimeDataAvailable()) {
      try {
        console.log("Attempting to fetch anomalies from real-time traffic API...");
        const realTimeData = await fetchRealTimeTrafficData();
        
        if (realTimeData.anomalies && realTimeData.anomalies.length > 0) {
          console.log(`Successfully fetched ${realTimeData.anomalies.length} anomalies from real-time API`);
          return realTimeData.anomalies;
        } else {
          console.log("Real-time API returned no anomalies, falling back to other sources");
        }
      } catch (realTimeError) {
        console.error("Error fetching anomalies from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    } else {
      console.log("Real-time data sources not available, falling back to database");
    }

    // Then try to fetch from Supabase
    try {
      console.log("Attempting to fetch anomalies from Supabase...");
      const data = await fetchFromSupabase<"anomalies">("anomalies", options);
      if (data.length > 0) {
        console.log(`Successfully fetched ${data.length} anomalies from Supabase`);
        return data;
      }
    } catch (error) {
      console.error("Error fetching anomalies from Supabase:", error);
      // Fallback to direct API or mock data
    }

    // Fallback to direct API
    try {
      console.log("Attempting to fetch anomalies from direct API...");
      const apiData = await fetchData("anomalies", options);
      if (apiData.length > 0) {
        console.log(`Successfully fetched ${apiData.length} anomalies from direct API`);
        return apiData;
      }
    } catch (apiError) {
      console.error("Error fetching anomalies from API:", apiError);
      return getMockAnomalies();
    }
    
    console.log("All data sources failed, using mock data");
    return getMockAnomalies();
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
