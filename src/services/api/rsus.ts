import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { RSU } from "./types";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

export async function fetchRSUs(options = {}): Promise<RSU[]> {
  try {
    // Always try to use real-time traffic API first
    if (isRealTimeDataAvailable()) {
      try {
        console.log("Attempting to fetch RSUs from real-time traffic API...");
        const realTimeData = await fetchRealTimeTrafficData();
        
        if (realTimeData.rsus && realTimeData.rsus.length > 0) {
          console.log(`Successfully fetched ${realTimeData.rsus.length} RSUs from real-time API`);
          return realTimeData.rsus;
        } else {
          console.log("Real-time API returned no RSUs, falling back to other sources");
        }
      } catch (realTimeError) {
        console.error("Error fetching RSUs from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    } else {
      console.log("Real-time data sources not available, falling back to database");
    }
    
    // Then try to fetch from Supabase
    try {
      console.log("Attempting to fetch RSUs from Supabase...");
      const data = await fetchFromSupabase<"rsus">("rsus", options);
      if (data.length > 0) {
        console.log(`Successfully fetched ${data.length} RSUs from Supabase`);
        return data;
      }
    } catch (error) {
      console.error("Error fetching RSUs from Supabase:", error);
      // Fallback to direct API or mock data
    }

    // Fallback to direct API
    try {
      console.log("Attempting to fetch RSUs from direct API...");
      const apiData = await fetchData("rsus", options);
      if (apiData.length > 0) {
        console.log(`Successfully fetched ${apiData.length} RSUs from direct API`);
        return apiData;
      }
    } catch (apiError) {
      console.error("Error fetching RSUs from API:", apiError);
      // Final fallback to mock data
    }
    
    console.log("All data sources failed, using mock data");
    return getMockRSUs();
  } catch (error) {
    console.error("All RSU data sources failed:", error);
    return getMockRSUs();
  }
}

// Mock data for RSUs - now used only as a last resort
export function getMockRSUs(): RSU[] {
  return [
    { 
      rsu_id: "RSU-001", 
      location: {
        lat: 17.4435,
        lng: 78.3772
      }, 
      lat: 17.4435, 
      lng: 78.3772, 
      status: 'Active',
      coverage_radius: 500
    },
    { 
      rsu_id: "RSU-002", 
      location: {
        lat: 17.4401,
        lng: 78.3489
      }, 
      lat: 17.4401, 
      lng: 78.3489, 
      status: 'Active',
      coverage_radius: 450
    },
    { 
      rsu_id: "RSU-003", 
      location: {
        lat: 17.4344,
        lng: 78.3826
      }, 
      lat: 17.4344, 
      lng: 78.3826, 
      status: 'Active',
      coverage_radius: 550
    },
    { 
      rsu_id: "RSU-004", 
      location: {
        lat: 17.4156,
        lng: 78.4347
      }, 
      lat: 17.4156, 
      lng: 78.4347, 
      status: 'Inactive',
      coverage_radius: 400
    },
    { 
      rsu_id: "RSU-005", 
      location: {
        lat: 17.4399,
        lng: 78.4983
      }, 
      lat: 17.4399, 
      lng: 78.4983, 
      status: 'Active',
      coverage_radius: 600
    }
  ];
}
