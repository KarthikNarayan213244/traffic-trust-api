
import { supabase } from "@/integrations/supabase/client";
import { ApiEndpoint } from "./config";

// Fetch data from Supabase
export async function fetchFromSupabase(endpoint: ApiEndpoint, options: Record<string, any> = {}) {
  let tableName: string;
  let result;
  
  switch (endpoint) {
    case "vehicles":
      tableName = "vehicles";
      // Use type assertion to bypass TypeScript errors
      result = await (supabase.from as any)(tableName).select("*");
      break;
    case "rsus":
      tableName = "rsus";
      // Use type assertion to bypass TypeScript errors
      result = await (supabase.from as any)(tableName).select("*");
      break;
    case "anomalies":
      tableName = "anomalies";
      // Use type assertion to bypass TypeScript errors with ordering
      result = await (supabase.from as any)(tableName).select("*").order('timestamp', { ascending: false });
      break;
    case "trustLedger":
      tableName = "trust_ledger";
      // Use type assertion to bypass TypeScript errors with ordering
      result = await (supabase.from as any)(tableName).select("*").order('timestamp', { ascending: false });
      break;
    case "congestion":
      tableName = "zones_congestion";
      // Use type assertion to bypass TypeScript errors with ordering
      result = await (supabase.from as any)(tableName).select("*").order('updated_at', { ascending: false });
      break;
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  // For endpoints where we didn't add specific query handling
  if (!result && tableName) {
    // Add limit if specified
    if (options.limit) {
      result = await (supabase.from as any)(tableName).select("*").limit(options.limit);
    } else {
      result = await (supabase.from as any)(tableName).select("*");
    }
  }
  
  // Apply limit if it wasn't applied above and it's specified in options
  if (result && options.limit && !['anomalies', 'trustLedger', 'congestion'].includes(endpoint)) {
    result = await (supabase.from as any)(tableName).select("*").limit(options.limit);
  }
  
  if (result.error) {
    throw result.error;
  }
  
  return result.data;
}

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false) {
  try {
    const url = new URL(`${window.location.origin}/functions/v1/seed-data`);
    if (clearExisting) {
      url.searchParams.append('clear', 'true');
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Seeding failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
