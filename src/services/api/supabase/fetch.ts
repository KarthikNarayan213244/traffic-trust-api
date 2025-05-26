
import { supabaseClient } from './client';
import { ENDPOINTS } from '../config';
import { FetchOptions, EndpointTypeMap, SupabaseTableMap, ApiEndpoint } from './types';

// Generic function to fetch data from Supabase that accepts an endpoint key
export async function fetchFromSupabase<T extends ApiEndpoint>(endpoint: T, options: FetchOptions = {}): Promise<any[]> {
  // Map API endpoints to Supabase tables
  const tableMap: SupabaseTableMap = {
    vehicles: "vehicles",
    rsus: "rsus",
    anomalies: "anomalies",
    trustLedger: "trust_ledger",
    congestion: "zones_congestion"
  };
  
  // Get the correct table name from the map
  const tableName = tableMap[endpoint];
  
  if (!tableName) {
    throw new Error(`Invalid endpoint: ${endpoint}. Available endpoints are: ${Object.keys(tableMap).join(', ')}`);
  }

  try {
    // Start query
    let query = supabaseClient
      .from(tableName)
      .select('*');

    // Apply filters if provided
    if (options.filters) {
      for (const [field, value] of Object.entries(options.filters)) {
        query = query.eq(field, value);
      }
    }
    
    // Apply sorting if provided
    if (options.orderBy) {
      const { field, ascending = true } = options.orderBy;
      query = query.order(field, { ascending });
    }
    
    // Apply pagination if provided
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // If specific endpoint handlers are needed
    if (endpoint === 'anomalies') {
      // Special handling for anomalies
      if (options.filters?.recent === true) {
        // Get anomalies from last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gt('timestamp', yesterday.toISOString());
      }
    } 
    else if (endpoint === 'trustLedger') {
      // Special handling for trust ledger
      if (!options.orderBy) {
        query = query.order('timestamp', { ascending: false });
      }
    }
    else if (endpoint === 'congestion') {
      // Special handling for congestion data
      if (options.filters?.current === true) {
        // Get current congestion data (last hour)
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        query = query.gt('timestamp', oneHourAgo.toISOString());
      }
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error(`Supabase query error for ${endpoint}:`, error);
      throw error;
    }
    
    // Type-specific transformations if needed
    if (endpoint === 'vehicles') {
      return transformVehicleData(data);
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching ${endpoint} from Supabase:`, error);
    throw error;
  }
}

function transformVehicleData(data: any[]): any[] {
  return data.map(vehicle => {
    // Add any vehicle-specific transformations here
    return vehicle;
  });
}
