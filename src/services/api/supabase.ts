
import { supabase } from "@/integrations/supabase/client";
import { ApiEndpoint } from "./config";

// Fetch data from Supabase
export async function fetchFromSupabase(endpoint: ApiEndpoint, options: Record<string, any> = {}) {
  let tableName: string;
  let result;
  
  switch (endpoint) {
    case "vehicles":
      tableName = "vehicles";
      result = await supabase.from(tableName).select("*");
      break;
    case "rsus":
      tableName = "rsus";
      result = await supabase.from(tableName).select("*");
      break;
    case "anomalies":
      tableName = "anomalies";
      result = await supabase.from(tableName).select("*").order('timestamp', { ascending: false });
      break;
    case "trustLedger":
      tableName = "trust_ledger";
      result = await supabase.from(tableName).select("*").order('timestamp', { ascending: false });
      break;
    case "congestion":
      tableName = "zones_congestion";
      result = await supabase.from(tableName).select("*");
      break;
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  // Apply limit if specified in options
  if (options.limit && result) {
    result = await supabase.from(tableName).select("*").limit(options.limit);
  }
  
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
