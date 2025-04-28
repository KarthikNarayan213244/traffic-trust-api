
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Vehicle } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchVehicles(options = {}): Promise<Vehicle[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("vehicles" as ApiEndpoint, options);
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

// Mock data for vehicles
export const getMockVehicles = (): Vehicle[] => [
  { vehicle_id: "TS07-2345-AB", owner_name: "Raj Kumar", vehicle_type: "Sedan", trust_score: 95, lat: 17.4435, lng: 78.3772, speed: 35 },
  { vehicle_id: "TS08-5678-CD", owner_name: "Priya Sharma", vehicle_type: "SUV", trust_score: 88, lat: 17.4401, lng: 78.3489, speed: 42 },
  { vehicle_id: "TS09-1010-XY", owner_name: "Amit Patel", vehicle_type: "Truck", trust_score: 92, lat: 17.4156, lng: 78.4347, speed: 28 },
  { vehicle_id: "TS07-9876-EF", owner_name: "Deepa Reddy", vehicle_type: "Compact", trust_score: 97, lat: 17.4321, lng: 78.4075, speed: 45 },
  { vehicle_id: "TS08-1234-GH", owner_name: "Vikram Singh", vehicle_type: "Sedan", trust_score: 75, lat: 17.4399, lng: 78.4983, speed: 38 }
];
