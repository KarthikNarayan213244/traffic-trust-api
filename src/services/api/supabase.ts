
import { supabase } from "@/integrations/supabase/client";
import { ApiEndpoint } from "./config";

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

// Fetch data from Supabase
export async function fetchFromSupabase(endpoint: ApiEndpoint, options: Record<string, any> = {}) {
  // Get the corresponding table name for this endpoint
  const tableName = endpointToTableMap[endpoint] as ValidTableName;
  
  if (!tableName) {
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }
  
  let query;
  
  // Apply query customizations based on endpoint
  switch (endpoint) {
    case "anomalies":
      query = supabase.from(tableName).select("*").order('timestamp', { ascending: false });
      break;
    case "trustLedger":
      query = supabase.from(tableName).select("*").order('timestamp', { ascending: false });
      break;
    case "congestion":
      query = supabase.from(tableName).select("*");
      break;
    default:
      query = supabase.from(tableName).select("*");
      break;
  }

  // Apply limit if specified in options
  if (options.limit && query) {
    query = supabase.from(tableName).select("*").limit(options.limit);
    
    // Re-apply ordering if needed
    if (endpoint === "anomalies" || endpoint === "trustLedger") {
      query = query.order('timestamp', { ascending: false });
    }
  }
  
  const result = await query;
  
  if (result.error) {
    console.error(`Supabase error for ${endpoint}:`, result.error);
    throw result.error;
  }
  
  return result.data;
}

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false) {
  try {
    console.log("Starting database seeding process...");
    const url = `${window.location.origin}/functions/v1/seed-data`;
    console.log(`Sending request to: ${url}`);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
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
      throw new Error(`Seeding failed with status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Seeding completed successfully:", result);
    return result;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
