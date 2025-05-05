import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Fetches trust ledger data from the API
 */
export async function fetchTrustLedger(options: FetchOptions = {}): Promise<any[]> {
  try {
    // Add a default target_type filter if not provided
    if (!options.filters) {
      options.filters = { target_type: 'RSU' };
    } else if (!options.filters.target_type) {
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
    
    // Insert directly using Supabase client
    const { data, error } = await supabase
      .from('trust_ledger')
      .insert(entry)
      .select();
    
    if (error) {
      console.error("Error inserting trust ledger entry:", error);
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    return data?.[0] || entry;
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
    
    if (anomalies.length === 0) {
      return [];
    }
    
    // Try Direct Supabase Insert for anomalies
    try {
      // Format anomalies to ensure all required fields
      const formattedAnomalies = anomalies.map(anomaly => ({
        id: anomaly.id || `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: anomaly.type,
        timestamp: anomaly.timestamp || new Date().toISOString(),
        message: anomaly.message || `${anomaly.type} detected on RSU ${anomaly.target_id}`,
        severity: anomaly.severity || "Medium",
        status: anomaly.status || "Detected",
        vehicle_id: anomaly.vehicle_id || null,
        target_id: anomaly.target_id,
        target_type: anomaly.target_type || 'RSU'
      }));
      
      // Use supabase client to directly insert anomalies
      const { data, error } = await supabase
        .from('anomalies')
        .insert(formattedAnomalies)
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Also create trust ledger entries for each anomaly
      const trustResults = [];
      for (const anomaly of formattedAnomalies) {
        try {
          // Create trust ledger entry for this anomaly
          const trustEntry = {
            tx_id: `anomaly-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            timestamp: anomaly.timestamp,
            vehicle_id: 'SYSTEM',
            action: anomaly.type,
            old_value: 90, // Placeholder values
            new_value: 70,
            details: anomaly.message,
            target_id: anomaly.target_id,
            target_type: 'RSU'
          };
          
          const result = await createTrustLedgerEntry(trustEntry);
          trustResults.push(result);
          
          toast({
            title: "Security Event Created",
            description: `${anomaly.type} detected on RSU ${anomaly.target_id}`,
          });
        } catch (entryError) {
          console.error("Failed to create trust entry:", entryError);
        }
      }
      
      return data || formattedAnomalies;
    } catch (supabaseError) {
      console.error("Error storing anomalies via Supabase:", supabaseError);
      toast({
        title: "Error",
        description: "Failed to create security events. Please try again.",
        variant: "destructive"
      });
      return [];
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
