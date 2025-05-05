
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";

/**
 * Fetches vehicle data from the API
 */
export async function fetchVehicles(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("vehicles", options);
  } catch (error) {
    console.error("Error fetching vehicles from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("vehicles", options);
  }
}

/**
 * Generates mock vehicle data for testing and development
 */
export function getMockVehicles(): any[] {
  return [
    {
      id: "v1",
      vehicle_id: "HYD-1234",
      owner_name: "Raj Kumar",
      vehicle_type: "Sedan",
      trust_score: 95,
      lat: 17.385,
      lng: 78.4867,
      speed: 45,
      heading: 90,
      status: "Active",
      timestamp: new Date().toISOString()
    },
    {
      id: "v2",
      vehicle_id: "HYD-5678",
      owner_name: "Priya Singh",
      vehicle_type: "SUV",
      trust_score: 87,
      lat: 17.395,
      lng: 78.4917,
      speed: 32,
      heading: 180,
      status: "Active",
      timestamp: new Date().toISOString()
    },
    {
      id: "v3",
      vehicle_id: "HYD-9012",
      owner_name: "Amit Patel",
      vehicle_type: "Truck",
      trust_score: 76,
      lat: 17.375,
      lng: 78.4767,
      speed: 25,
      heading: 270,
      status: "Active",
      timestamp: new Date().toISOString()
    }
  ];
}
