
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Vehicle } from "./types";
import { ApiEndpoint } from "./supabase/types";

export async function fetchVehicles(options = {}): Promise<Vehicle[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("vehicles", options);
    return data;
  } catch (error) {
    console.error("Error fetching vehicles from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      return await fetchData("vehicles", options);
    } catch (apiError) {
      console.error("Error fetching vehicles from API:", apiError);
      return getMockVehicles();
    }
  }
}

// Mock data for vehicles (for offline development/testing)
export function getMockVehicles(): Vehicle[] {
  return [
    { vehicle_id: "TS07-1234-AB", owner_name: "Rahul Sharma", vehicle_type: "Sedan", trust_score: 95, lat: 17.4344, lng: 78.3866, speed: 45 },
    { vehicle_id: "TS08-5678-CD", owner_name: "Priya Patel", vehicle_type: "SUV", trust_score: 88, lat: 17.4384, lng: 78.3869, speed: 60 },
    { vehicle_id: "TS09-9012-EF", owner_name: "Vikram Singh", vehicle_type: "Hatchback", trust_score: 91, lat: 17.4395, lng: 78.3892, speed: 35 },
    { vehicle_id: "TS10-3456-GH", owner_name: "Ananya Reddy", vehicle_type: "Sedan", trust_score: 99, lat: 17.4420, lng: 78.3880, speed: 40 }
  ];
}
