
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

// More realistic mock data for vehicles in Hyderabad
export const getMockVehicles = (): Vehicle[] => [
  { vehicle_id: "TS07-2345-AB", owner_name: "Raj Kumar", vehicle_type: "Sedan", trust_score: 95, lat: 17.4435, lng: 78.3772, speed: 35 },
  { vehicle_id: "TS08-5678-CD", owner_name: "Priya Sharma", vehicle_type: "SUV", trust_score: 88, lat: 17.4401, lng: 78.3489, speed: 42 },
  { vehicle_id: "TS09-1010-XY", owner_name: "Amit Patel", vehicle_type: "Truck", trust_score: 92, lat: 17.4156, lng: 78.4347, speed: 28 },
  { vehicle_id: "TS07-9876-EF", owner_name: "Deepa Reddy", vehicle_type: "Compact", trust_score: 97, lat: 17.4321, lng: 78.4075, speed: 45 },
  { vehicle_id: "TS08-1234-GH", owner_name: "Vikram Singh", vehicle_type: "Sedan", trust_score: 75, lat: 17.4399, lng: 78.4983, speed: 38 },
  { vehicle_id: "TS10-6789-JK", owner_name: "Sunita Rao", vehicle_type: "Ambulance", trust_score: 99, lat: 17.4329, lng: 78.4123, speed: 65 },
  { vehicle_id: "TS07-4567-LM", owner_name: "Kiran Kumar", vehicle_type: "Bus", trust_score: 87, lat: 17.4152, lng: 78.4566, speed: 25 },
  { vehicle_id: "TS11-9012-NO", owner_name: "Anjali Reddy", vehicle_type: "Two-Wheeler", trust_score: 82, lat: 17.3955, lng: 78.4544, speed: 48 },
  { vehicle_id: "TS12-3456-PQ", owner_name: "Suresh Menon", vehicle_type: "Truck", trust_score: 79, lat: 17.3850, lng: 78.4867, speed: 22 },
  { vehicle_id: "TS13-7890-RS", owner_name: "Lakshmi Prasad", vehicle_type: "SUV", trust_score: 93, lat: 17.4102, lng: 78.5102, speed: 37 },
  { vehicle_id: "TS09-2345-TU", owner_name: "Ravi Shankar", vehicle_type: "Ambulance", trust_score: 98, lat: 17.4523, lng: 78.3892, speed: 60 },
  { vehicle_id: "TS08-6789-VW", owner_name: "Ananya Kapoor", vehicle_type: "Compact", trust_score: 86, lat: 17.4678, lng: 78.4255, speed: 33 },
  { vehicle_id: "TS14-1234-XY", owner_name: "Harish Chandra", vehicle_type: "Bus", trust_score: 84, lat: 17.3729, lng: 78.4334, speed: 27 },
  { vehicle_id: "TS15-5678-ZA", owner_name: "Meena Kumari", vehicle_type: "Two-Wheeler", trust_score: 78, lat: 17.3892, lng: 78.3998, speed: 44 },
  { vehicle_id: "TS07-9012-BC", owner_name: "Prakash Jha", vehicle_type: "Sedan", trust_score: 91, lat: 17.4212, lng: 78.4492, speed: 39 }
];
