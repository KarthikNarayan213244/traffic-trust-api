
// API configuration and helper functions
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

const API_CONFIG = {
  baseUrl: "http://localhost:5000", // This can be updated to your API URL
  endpoints: {
    vehicles: "/api/vehicles",
    rsus: "/api/rsus",
    anomalies: "/api/anomalies",
    trustLedger: "/api/trust/live_ledger",
    congestion: "/api/congestion"
  }
};

export async function fetchData(endpoint: string, options = {}) {
  try {
    // First try to fetch from Supabase
    return await fetchFromSupabase(endpoint, options);
  } catch (error) {
    console.error(`Error fetching data from Supabase for ${endpoint}:`, error);
    
    // Fallback to direct API
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint as keyof typeof API_CONFIG.endpoints]}`;
      console.log(`Falling back to direct API: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (apiError) {
      console.error(`Error fetching data from direct API for ${endpoint}:`, apiError);
      // If API fails too, fall back to mock data for development
      return getMockData(endpoint);
    }
  }
}

async function fetchFromSupabase(endpoint: string, options: Record<string, any> = {}) {
  let tableName: string;
  let query: any;
  
  switch (endpoint) {
    case "vehicles":
      tableName = "vehicles";
      break;
    case "rsus":
      tableName = "rsus";
      break;
    case "anomalies":
      tableName = "anomalies";
      // Use any type to bypass TypeScript checking for tables not in the generated types
      query = supabase.from(tableName) as any;
      query = query.select("*").order('timestamp', { ascending: false });
      break;
    case "trustLedger":
      tableName = "trust_ledger";
      // Use any type to bypass TypeScript checking for tables not in the generated types
      query = supabase.from(tableName) as any;
      query = query.select("*").order('timestamp', { ascending: false });
      break;
    case "congestion":
      tableName = "zones_congestion";
      // Use any type to bypass TypeScript checking for tables not in the generated types
      query = supabase.from(tableName) as any;
      query = query.select("*").order('updated_at', { ascending: false });
      break;
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  // If query wasn't set above, create default query
  if (!query) {
    // Use any type to bypass TypeScript checking for tables not in the generated types
    query = supabase.from(tableName as string) as any;
    query = query.select("*");
  }

  // Add limit if specified
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function fetchVehicles(options = {}) {
  return fetchData("vehicles", options);
}

export async function fetchRSUs(options = {}) {
  return fetchData("rsus", options);
}

export async function fetchAnomalies(options = {}) {
  return fetchData("anomalies", options);
}

export async function fetchTrustLedger(options = {}) {
  return fetchData("trustLedger", options);
}

export async function fetchCongestionData(options = {}) {
  return fetchData("congestion", options);
}

// Mock data functions for development
export const getMockVehicles = () => [
  { vehicle_id: "TS07-2345-AB", owner_name: "Raj Kumar", vehicle_type: "Sedan", trust_score: 95, lat: 17.4435, lng: 78.3772, speed: 35 },
  { vehicle_id: "TS08-5678-CD", owner_name: "Priya Sharma", vehicle_type: "SUV", trust_score: 88, lat: 17.4401, lng: 78.3489, speed: 42 },
  { vehicle_id: "TS09-1010-XY", owner_name: "Amit Patel", vehicle_type: "Truck", trust_score: 92, lat: 17.4156, lng: 78.4347, speed: 28 },
  { vehicle_id: "TS07-9876-EF", owner_name: "Deepa Reddy", vehicle_type: "Compact", trust_score: 97, lat: 17.4321, lng: 78.4075, speed: 45 },
  { vehicle_id: "TS08-1234-GH", owner_name: "Vikram Singh", vehicle_type: "Sedan", trust_score: 75, lat: 17.4399, lng: 78.4983, speed: 38 }
];

export const getMockRSUs = () => [
  { rsu_id: "RSU-1001", location: "Hitech City", status: "Active", coverage_radius: 500, lat: 17.4435, lng: 78.3772 },
  { rsu_id: "RSU-1002", location: "Gachibowli", status: "Active", coverage_radius: 800, lat: 17.4401, lng: 78.3489 },
  { rsu_id: "RSU-1003", location: "Banjara Hills", status: "Inactive", coverage_radius: 600, lat: 17.4156, lng: 78.4347 },
  { rsu_id: "RSU-1004", location: "Secunderabad", status: "Active", coverage_radius: 700, lat: 17.4399, lng: 78.4983 }
];

export const getMockAnomalies = () => [
  { id: 1, timestamp: "2025-04-28T10:05:00Z", type: "Speed Violation", severity: "High", vehicle_id: "TS08-5678-CD", message: "Speed limit violation detected" },
  { id: 2, timestamp: "2025-04-28T09:15:00Z", type: "Signal Tampering", severity: "Critical", vehicle_id: "TS08-1234-GH", message: "Suspicious signal activity detected" },
  { id: 3, timestamp: "2025-04-28T08:30:00Z", type: "Unauthorized Access", severity: "Medium", vehicle_id: "TS07-2345-AB", message: "Security breach attempt" },
  { id: 4, timestamp: "2025-04-27T22:45:00Z", type: "GPS Spoofing", severity: "High", vehicle_id: "TS09-1010-XY", message: "Location spoofing attempt" }
];

export const getMockTrustLedger = () => [
  { tx_id: "TX123456", timestamp: "2025-04-28T10:30:00Z", vehicle_id: "TS07-2345-AB", action: "Trust Score Update", old_value: 90, new_value: 95 },
  { tx_id: "TX123457", timestamp: "2025-04-28T09:45:00Z", vehicle_id: "TS08-5678-CD", action: "Trust Score Update", old_value: 95, new_value: 88 },
  { tx_id: "TX123458", timestamp: "2025-04-28T08:15:00Z", vehicle_id: "TS08-1234-GH", action: "Trust Score Update", old_value: 85, new_value: 75 },
  { tx_id: "TX123459", timestamp: "2025-04-28T07:30:00Z", vehicle_id: "TS09-1010-XY", action: "Trust Score Update", old_value: 89, new_value: 92 }
];

export const getMockCongestion = () => [
  { id: 1, zone_name: "Hitech City", level: 8, lat: 17.4435, lng: 78.3772, updated_at: "2025-04-28T10:15:00Z" },
  { id: 2, zone_name: "Gachibowli", level: 5, lat: 17.4401, lng: 78.3489, updated_at: "2025-04-28T10:15:00Z" },
  { id: 3, zone_name: "Banjara Hills", level: 3, lat: 17.4156, lng: 78.4347, updated_at: "2025-04-28T10:15:00Z" },
  { id: 4, zone_name: "Secunderabad", level: 6, lat: 17.4399, lng: 78.4983, updated_at: "2025-04-28T10:15:00Z" }
];

// Type definitions for the data models
export type Vehicle = {
  vehicle_id: string;
  owner_name: string;
  vehicle_type: string;
  trust_score: number;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  timestamp?: string;
  location?: string;
  status?: string;
};

export type Rsu = {
  rsu_id: string;
  location: string;
  status: string;
  coverage_radius: number;
  lat: number;
  lng: number;
};

export type Anomaly = {
  id: number | string;
  timestamp: string;
  type: string;
  severity: string;
  vehicle_id: string;
  message: string;
  status?: string;
};

export type TrustLedgerEntry = {
  tx_id: string;
  timestamp: string;
  vehicle_id: string;
  action: string;
  old_value: number;
  new_value: number;
  details?: string;
};

export type CongestionZone = {
  id: number;
  zone_name: string;
  lat: number;
  lng: number;
  congestion_level: number;
  updated_at: string;
};

export const getMockData = (endpoint: string): Vehicle[] | Rsu[] | Anomaly[] | TrustLedgerEntry[] | CongestionZone[] | any[] => {
  switch (endpoint) {
    case "vehicles":
      return getMockVehicles();
    case "rsus":
      return getMockRSUs();
    case "anomalies":
      return getMockAnomalies();
    case "trustLedger":
      return getMockTrustLedger();
    case "congestion":
      return getMockCongestion();
    default:
      return [];
  }
};
