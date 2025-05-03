
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Vehicle } from "./types";
import { ApiEndpoint } from "./config";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

export async function fetchVehicles(options = {}): Promise<Vehicle[]> {
  try {
    // Always try to use real-time traffic API first
    if (isRealTimeDataAvailable()) {
      try {
        console.log("Attempting to fetch vehicles from real-time traffic API...");
        const realTimeData = await fetchRealTimeTrafficData();
        
        if (realTimeData.vehicles && realTimeData.vehicles.length > 0) {
          console.log(`Successfully fetched ${realTimeData.vehicles.length} vehicles from real-time API`);
          return realTimeData.vehicles;
        } else {
          console.log("Real-time API returned no vehicles, falling back to other sources");
        }
      } catch (realTimeError) {
        console.error("Error fetching vehicles from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    } else {
      console.log("Real-time data sources not available, falling back to database");
    }
    
    // Then try to fetch from Supabase
    try {
      console.log("Attempting to fetch vehicles from Supabase...");
      const data = await fetchFromSupabase<"vehicles">("vehicles", options);
      if (data.length > 0) {
        console.log(`Successfully fetched ${data.length} vehicles from Supabase`);
        return data;
      }
    } catch (error) {
      console.error("Error fetching vehicles from Supabase:", error);
      // Fallback to direct API or mock data
    }

    // Fallback to direct API
    try {
      console.log("Attempting to fetch vehicles from direct API...");
      const apiData = await fetchData("vehicles", options);
      if (apiData.length > 0) {
        console.log(`Successfully fetched ${apiData.length} vehicles from direct API`);
        return apiData;
      }
    } catch (apiError) {
      console.error("Error fetching vehicles from API:", apiError);
      // Final fallback to mock data
    }
    
    console.log("All data sources failed, using mock data");
    return getMockVehicles();
  } catch (error) {
    console.error("All vehicle data sources failed:", error);
    return getMockVehicles();
  }
}

// Mock data for vehicles (for offline development/testing)
export function getMockVehicles(): Vehicle[] {
  return [
    { 
      vehicle_id: "TS07-1234-AB", 
      owner_name: "Rahul Sharma", 
      vehicle_type: "Sedan", 
      trust_score: 95, 
      location: { lat: 17.4344, lng: 78.3866 },
      lat: 17.4344, 
      lng: 78.3866, 
      speed: 45,
      heading: 90,
      trust_score_change: 0,
      trust_score_confidence: 0.95,
      status: "Active",
      timestamp: new Date().toISOString()
    },
    { 
      vehicle_id: "TS08-5678-CD", 
      owner_name: "Priya Patel", 
      vehicle_type: "SUV", 
      trust_score: 88, 
      location: { lat: 17.4384, lng: 78.3869 },
      lat: 17.4384, 
      lng: 78.3869, 
      speed: 60,
      heading: 180,
      trust_score_change: -2,
      trust_score_confidence: 0.88,
      status: "Active",
      timestamp: new Date().toISOString()
    },
    { 
      vehicle_id: "TS09-9012-EF", 
      owner_name: "Vikram Singh", 
      vehicle_type: "Hatchback", 
      trust_score: 91, 
      location: { lat: 17.4395, lng: 78.3892 },
      lat: 17.4395, 
      lng: 78.3892, 
      speed: 35,
      heading: 270,
      trust_score_change: 1,
      trust_score_confidence: 0.91,
      status: "Active",
      timestamp: new Date().toISOString()
    },
    { 
      vehicle_id: "TS10-3456-GH", 
      owner_name: "Ananya Reddy", 
      vehicle_type: "Sedan", 
      trust_score: 99, 
      location: { lat: 17.4420, lng: 78.3880 },
      lat: 17.4420, 
      lng: 78.3880, 
      speed: 40,
      heading: 0,
      trust_score_change: 0,
      trust_score_confidence: 0.99,
      status: "Active",
      timestamp: new Date().toISOString()
    }
  ];
}
