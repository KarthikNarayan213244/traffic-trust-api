
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
    
    // Transform data to match the expected types if needed
    if (endpoint === "trustLedger") {
      // Handle trust_ledger to TrustLedgerEntry mapping
      return (result.data || []).map(item => ({
        tx_id: item.tx_id,
        timestamp: item.timestamp,
        vehicle_id: item.vehicle_id,
        action: item.action,
        old_value: item.old_value,
        new_value: item.new_value,
        details: item.details
      })) as EndpointTypeMap[T];
    } else if (endpoint === "congestion") {
      // Handle zones_congestion to CongestionZone mapping
      return (result.data || []).map(item => ({
        id: typeof item.id === 'number' ? item.id : parseInt(item.id) || 0,
        zone_name: item.zone_name,
        lat: item.lat,
        lng: item.lng,
        congestion_level: item.congestion_level,
        updated_at: item.updated_at
      })) as EndpointTypeMap[T];
    }
    
    // Return typed data
    return (result.data || []) as EndpointTypeMap[T];
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
