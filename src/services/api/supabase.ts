
import { supabase } from "@/integrations/supabase/client";
import { ApiEndpoint } from "./config";
import { Vehicle, Rsu, Anomaly, TrustLedgerEntry, CongestionZone } from "./types";
import { toast } from "@/hooks/use-toast";

// Map API endpoints to their corresponding Supabase table names
const endpointToTableMap = {
  vehicles: "vehicles",
  rsus: "rsus",
  anomalies: "anomalies",
  trustLedger: "trust_ledger",
  congestion: "zones_congestion"
} as const;

// Define a type for valid table names based on the values in our map
type ValidTableName = typeof endpointToTableMap[keyof typeof endpointToTableMap];

// Type mapping for each endpoint's return type
type EndpointTypeMap = {
  vehicles: Vehicle[];
  rsus: Rsu[];
  anomalies: Anomaly[];
  trustLedger: TrustLedgerEntry[];
  congestion: CongestionZone[];
};

// Interface for table-specific data shapes
interface VehicleData {
  id: string;
  vehicle_id: string;
  owner_name: string;
  vehicle_type: string;
  trust_score: number;
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  timestamp?: string;
  location?: string | null;
  status?: string;
}

interface RsuData {
  id: string;
  rsu_id: string;
  location: string;
  status: string;
  coverage_radius: number;
  lat: number;
  lng: number;
  last_seen?: string | null;
}

interface AnomalyData {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  vehicle_id: string;
  message?: string | null;
  status?: string | null;
}

interface TrustLedgerData {
  id: string;
  tx_id: string;
  timestamp: string;
  vehicle_id: string;
  action: string;
  old_value: number;
  new_value: number;
  details?: string | null;
}

interface CongestionData {
  id: string;
  zone_name: string;
  lat: number;
  lng: number;
  congestion_level: number;
  updated_at: string;
}

// Type guard functions to check data types
function isVehicleData(data: any): data is VehicleData {
  return data && 'vehicle_id' in data && 'owner_name' in data && 'vehicle_type' in data;
}

function isRsuData(data: any): data is RsuData {
  return data && 'rsu_id' in data && 'coverage_radius' in data;
}

function isAnomalyData(data: any): data is AnomalyData {
  return data && 'type' in data && 'severity' in data && 'timestamp' in data;
}

function isTrustLedgerData(data: any): data is TrustLedgerData {
  return data && 'tx_id' in data && 'action' in data && 'old_value' in data && 'new_value' in data;
}

function isCongestionData(data: any): data is CongestionData {
  return data && 'zone_name' in data && 'congestion_level' in data;
}

// Fetch data from Supabase with proper type handling
export async function fetchFromSupabase<T extends ApiEndpoint>(endpoint: T, options: Record<string, any> = {}): Promise<EndpointTypeMap[T]> {
  // Get the corresponding table name for this endpoint
  const tableName = endpointToTableMap[endpoint] as ValidTableName;
  
  if (!tableName) {
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }
  
  let query = supabase.from(tableName).select("*");
  
  // Apply query customizations based on endpoint
  switch (endpoint) {
    case "anomalies":
      query = query.order('timestamp', { ascending: false });
      break;
    case "trustLedger":
      query = query.order('timestamp', { ascending: false });
      break;
    case "congestion":
      // No special handling needed for basic select
      break;
    default:
      // No special handling needed for other endpoints
      break;
  }

  // Apply limit if specified in options
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  try {
    const result = await query;
    
    if (result.error) {
      console.error(`Supabase error for ${endpoint}:`, result.error);
      throw result.error;
    }
    
    console.log(`Successfully fetched ${result.data?.length || 0} records from ${tableName}`);
    
    // Transform data to match the expected types based on the endpoint
    if (!result.data || result.data.length === 0) {
      return [] as EndpointTypeMap[T];
    }
    
    switch (endpoint) {
      case "vehicles":
        return result.data.map(item => ({
          vehicle_id: item.vehicle_id,
          owner_name: item.owner_name,
          vehicle_type: item.vehicle_type,
          trust_score: item.trust_score,
          lat: item.lat,
          lng: item.lng,
          speed: item.speed,
          heading: item.heading,
          timestamp: item.timestamp,
          location: item.location,
          status: item.status
        })) as EndpointTypeMap[T];
        
      case "rsus":
        return result.data.map(item => ({
          rsu_id: item.rsu_id,
          location: item.location,
          status: item.status,
          coverage_radius: item.coverage_radius,
          lat: item.lat,
          lng: item.lng
        })) as EndpointTypeMap[T];
        
      case "anomalies":
        return result.data.map(item => ({
          id: item.id,
          timestamp: item.timestamp,
          type: item.type,
          severity: item.severity,
          vehicle_id: item.vehicle_id,
          message: item.message,
          status: item.status
        })) as EndpointTypeMap[T];
        
      case "trustLedger":
        return result.data.map(item => ({
          tx_id: item.tx_id,
          timestamp: item.timestamp,
          vehicle_id: item.vehicle_id,
          action: item.action,
          old_value: item.old_value,
          new_value: item.new_value,
          details: item.details
        })) as EndpointTypeMap[T];
        
      case "congestion":
        return result.data.map(item => ({
          id: item.id,
          zone_name: item.zone_name,
          lat: item.lat,
          lng: item.lng,
          congestion_level: item.congestion_level,
          updated_at: item.updated_at
        })) as EndpointTypeMap[T];
        
      default:
        // For safety, fallback to direct return
        return result.data as EndpointTypeMap[T];
    }
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    throw error;
  }
}

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false) {
  try {
    console.log("Starting database seeding process...");
    toast({
      title: "Seeding database",
      description: "Please wait while we populate the database with test data...",
    });
    
    // Get the full URL for the edge function
    const supabaseUrl = 'https://ompvafpbdbwsmelomnla.supabase.co';
    const url = `${supabaseUrl}/functions/v1/seed-data`;
    console.log(`Sending request to: ${url}`);
    
    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    } else {
      console.log("No authentication token available, proceeding without authentication");
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clear: clearExisting,
        vehicles: 1000,
        rsus: 200,
        anomalies: 1000,
        trustEntries: 1000,
        congestionEntries: 50
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Seeding failed with status: ${response.status}`, errorText);
      toast({
        title: "Database Seeding Failed",
        description: `Error: ${response.status}. Please check console for details.`,
        variant: "destructive",
      });
      
      // Fall back to mock data
      console.log("Falling back to mock data generation");
      return {
        success: false,
        message: "Seeding failed, using mock data",
        counts: {
          vehicles: 0,
          rsus: 0,
          anomalies: 0,
          trustEntries: 0,
          congestionEntries: 0
        }
      };
    }
    
    const result = await response.json();
    console.log("Seeding completed successfully:", result);
    toast({
      title: "Database Seeded Successfully",
      description: `Added ${result.counts?.vehicles || 'many'} vehicles, ${result.counts?.rsus || 'many'} RSUs, and more data to the database.`,
    });
    return result;
  } catch (error) {
    console.error('Error seeding database:', error);
    toast({
      title: "Database Seeding Failed",
      description: `Error: ${error.message || "Unknown error"}. Please try again or check console for details.`,
      variant: "destructive",
    });
    
    // Return a default object that can be handled by the calling code
    return {
      success: false,
      message: error.message || "Unknown error occurred",
      counts: {
        vehicles: 0,
        rsus: 0,
        anomalies: 0,
        trustEntries: 0,
        congestionEntries: 0
      }
    };
  }
}
