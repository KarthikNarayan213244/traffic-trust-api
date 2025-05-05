
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches trust ledger data from the API
 */
export async function fetchTrustLedger(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Add a default target_type filter if not provided
    if (options.filters && !options.filters.target_type) {
      options.filters = { ...options.filters, target_type: 'RSU' };
    }
    
    // Attempt to fetch from Supabase
    return await fetchFromSupabase("trustLedger", options);
  } catch (error) {
    console.error("Error fetching trust ledger from Supabase, falling back to mock data:", error);
    // Fallback to mock data service
    return fetchData("trustLedger", options);
  }
}

/**
 * Creates a new trust ledger entry
 */
export async function createTrustLedgerEntry(entry: any): Promise<any> {
  try {
    // Ensure required fields are present
    if (!entry.tx_id) entry.tx_id = `trust-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    if (!entry.timestamp) entry.timestamp = new Date().toISOString();
    if (!entry.target_type) entry.target_type = 'RSU'; // Default to RSU
    
    console.log("Creating trust ledger entry:", entry);
    
    // Attempt to create in Supabase
    const result = await fetch('/api/trust-ledger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    
    if (!result.ok) {
      const errorText = await result.text();
      throw new Error(`API error: ${errorText}`);
    }
    
    return await result.json();
  } catch (error) {
    console.error("Error creating trust ledger entry:", error);
    throw error;
  }
}

/**
 * Creates new anomaly entries for RSUs
 */
export async function createAnomalies(anomalies: any[]): Promise<any[]> {
  try {
    console.log(`Storing ${anomalies.length} anomalies`);
    
    // Try Direct Supabase Insert - using the supabase client directly
    try {
      // Use the supabase client to insert anomalies directly
      const { data, error } = await supabase
        .from('anomalies')
        .insert(anomalies)
        .select();
      
      if (error) throw new Error(error.message);
      return data || [];
    } catch (supabaseError) {
      console.error("Error storing anomalies via Supabase:", supabaseError);
      
      // Fallback to trust ledger entries instead of anomalies
      const trustEntries = anomalies.map(anomaly => ({
        tx_id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp: anomaly.timestamp,
        vehicle_id: 'SYSTEM',
        action: anomaly.type,
        old_value: 90, // Placeholder values
        new_value: 70,
        details: anomaly.message,
        target_id: anomaly.target_id,
        target_type: 'RSU'
      }));
      
      // Try to insert trust entries one by one to avoid a single failure affecting all
      const results = [];
      for (const entry of trustEntries) {
        try {
          const result = await createTrustLedgerEntry(entry);
          results.push(result);
        } catch (entryError) {
          console.error("Failed to create trust entry:", entryError);
        }
      }
      
      return results;
    }
  } catch (error) {
    console.error("Error creating anomalies:", error);
    return [];
  }
}

/**
 * Generates mock trust ledger data for testing and development
 */
export function getMockTrustLedger(): any[] {
  const now = new Date();
  
  // Include some RSU-specific mock data
  return [
    {
      id: "t1",
      vehicle_id: "HYD-1234",
      action: "Score Update",
      old_value: 90,
      new_value: 95,
      details: "Regular trusted behavior",
      tx_id: "0x1234567890abcdef1234567890abcdef12345678",
      timestamp: now.toISOString(),
      target_type: "VEHICLE"
    },
    {
      id: "t2",
      vehicle_id: "SYSTEM",
      action: "TRUST_UPDATE",
      old_value: 92,
      new_value: 87,
      details: "Anomaly detected in RSU",
      tx_id: "0xabcdef1234567890abcdef1234567890abcdef12",
      timestamp: new Date(now.getTime() - 86400000).toISOString(),  // 1 day ago
      target_id: "RSU-001",
      target_type: "RSU"
    },
    {
      id: "t3",
      vehicle_id: "SYSTEM",
      action: "ATTACK_DETECTED",
      old_value: 85,
      new_value: 65,
      details: "Sybil attack detected on RSU",
      tx_id: "0x7890abcdef1234567890abcdef1234567890abcd",
      timestamp: new Date(now.getTime() - 172800000).toISOString(),  // 2 days ago
      target_id: "RSU-002",
      target_type: "RSU"
    },
    {
      id: "t4",
      vehicle_id: "SYSTEM",
      action: "RSU_QUARANTINED",
      old_value: 65,
      new_value: 30,
      details: "RSU quarantined due to continued suspicious activity",
      tx_id: "0x567890abcdef1234567890abcdef1234567890ab",
      timestamp: new Date(now.getTime() - 259200000).toISOString(),  // 3 days ago
      target_id: "RSU-003",
      target_type: "RSU"
    }
  ];
}
