
import { fetchFromSupabase } from "./supabase";
import { FetchOptions } from "./supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Fetches RSU trust ledger data from the database
 */
export async function fetchRsuTrustLedger(options: FetchOptions = {}): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('rsu_trust_ledger')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(options.limit || 100);
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching RSU trust ledger:", error);
    return [];
  }
}

/**
 * Creates a new RSU trust ledger entry for an attack or anomaly
 */
export async function createRsuAttackEntry(entry: {
  rsu_id: string;
  attack_type: string;
  severity: string;
  details?: string;
  old_trust?: number;
  new_trust?: number;
}): Promise<any> {
  try {
    // Set default trust values if not provided
    if (entry.old_trust === undefined) {
      entry.old_trust = 90;
    }
    
    if (entry.new_trust === undefined) {
      // Calculate new trust based on severity
      switch (entry.severity) {
        case 'Critical':
          entry.new_trust = Math.max(0, entry.old_trust - 30);
          break;
        case 'High':
          entry.new_trust = Math.max(0, entry.old_trust - 20);
          break;
        case 'Medium':
          entry.new_trust = Math.max(0, entry.old_trust - 10);
          break;
        case 'Low':
          entry.new_trust = Math.max(0, entry.old_trust - 5);
          break;
        default:
          entry.new_trust = entry.old_trust;
      }
    }
    
    const { data, error } = await supabase
      .from('rsu_trust_ledger')
      .insert({
        ...entry,
        timestamp: new Date().toISOString()
      })
      .select();
      
    if (error) {
      throw error;
    }
    
    toast({
      title: "Attack Recorded",
      description: `${entry.attack_type} on RSU ${entry.rsu_id} recorded`,
    });
    
    return data?.[0] || null;
  } catch (error) {
    console.error("Error creating RSU attack entry:", error);
    
    toast({
      title: "Error",
      description: "Failed to record RSU attack",
      variant: "destructive"
    });
    
    throw error;
  }
}

/**
 * Creates multiple RSU attack entries
 */
export async function createRsuAttacks(attacks: any[]): Promise<any[]> {
  try {
    if (attacks.length === 0) {
      return [];
    }
    
    const formattedAttacks = attacks.map(attack => ({
      rsu_id: attack.target_id || attack.rsu_id,
      attack_type: attack.type || attack.attack_type,
      severity: attack.severity || "Medium",
      details: attack.message || attack.details,
      old_trust: attack.old_trust || 90,
      new_trust: attack.new_trust || 70
    }));
    
    const { data, error } = await supabase
      .from('rsu_trust_ledger')
      .insert(formattedAttacks)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error creating RSU attacks:", error);
    throw error;
  }
}

/**
 * Generates mock RSU trust ledger data for testing
 */
export function getMockRsuTrustLedger(): any[] {
  const now = new Date();
  
  return [
    {
      id: "r1",
      rsu_id: "RSU-001",
      attack_type: "TRUST_UPDATE",
      severity: "Low",
      details: "Trust score updated based on network validation",
      old_trust: 92,
      new_trust: 87,
      timestamp: now.toISOString()
    },
    {
      id: "r2",
      rsu_id: "RSU-002",
      attack_type: "Sybil Attack",
      severity: "High",
      details: "Multiple fake identities detected",
      old_trust: 85,
      new_trust: 65,
      timestamp: new Date(now.getTime() - 86400000).toISOString()  // 1 day ago
    },
    {
      id: "r3",
      rsu_id: "RSU-003",
      attack_type: "Denial of Service",
      severity: "Critical",
      details: "Communication channels flooded",
      old_trust: 80,
      new_trust: 40,
      timestamp: new Date(now.getTime() - 172800000).toISOString()  // 2 days ago
    }
  ];
}
