
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Fetches vehicle trust ledger data from the database
 */
export async function fetchVehicleTrustLedger(options: FetchOptions = {}): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_trust_ledger')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(options.limit || 100);
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching vehicle trust ledger:", error);
    return [];
  }
}

/**
 * Creates a new vehicle trust ledger entry
 */
export async function createVehicleTrustEntry(entry: {
  vehicle_id: string;
  old_trust: number;
  new_trust: number;
  action_type: string;
  details?: string;
}): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('vehicle_trust_ledger')
      .insert({
        ...entry,
        timestamp: new Date().toISOString()
      })
      .select();
      
    if (error) {
      throw error;
    }
    
    toast({
      title: "Trust Updated",
      description: `Vehicle ${entry.vehicle_id} trust updated to ${entry.new_trust}`,
    });
    
    return data?.[0] || null;
  } catch (error) {
    console.error("Error creating vehicle trust entry:", error);
    
    toast({
      title: "Error",
      description: "Failed to update vehicle trust",
      variant: "destructive"
    });
    
    throw error;
  }
}

/**
 * Generates mock vehicle trust ledger data for testing
 */
export function getMockVehicleTrustLedger(): any[] {
  const now = new Date();
  
  return [
    {
      id: "v1",
      vehicle_id: "HYD-1234",
      action_type: "Trust Score Update",
      old_trust: 90,
      new_trust: 95,
      details: "Regular trusted behavior",
      timestamp: now.toISOString()
    },
    {
      id: "v2",
      vehicle_id: "EV-5678",
      action_type: "Penalize",
      old_trust: 75,
      new_trust: 65,
      details: "Sudden speeding detected",
      timestamp: new Date(now.getTime() - 86400000).toISOString()  // 1 day ago
    },
    {
      id: "v3",
      vehicle_id: "BUS-901",
      action_type: "Reward",
      old_trust: 82,
      new_trust: 88,
      details: "Consistent route compliance",
      timestamp: new Date(now.getTime() - 172800000).toISOString()  // 2 days ago
    }
  ];
}
