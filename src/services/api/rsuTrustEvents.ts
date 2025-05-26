
import { supabaseClient } from './supabase/client';

export interface RsuTrustEvent {
  id?: string;
  rsu_id: string;
  attack_type: string;
  severity: string;
  old_trust?: number;
  new_trust?: number;
  timestamp: string;
  details?: string;
}

export interface RsuAnomaly {
  id?: string;
  vehicle_id: string;
  type: string;
  severity: string;
  timestamp: string;
  message?: string;
  status?: string;
}

// Create RSU trust events in the rsu_trust_ledger table
export const createRsuTrustEvents = async (events: RsuTrustEvent[]): Promise<any[]> => {
  try {
    console.log('Inserting RSU trust events:', events.length);
    
    const { data, error } = await supabaseClient
      .from('rsu_trust_ledger')
      .insert(events)
      .select();
    
    if (error) {
      console.error('Error inserting RSU trust events:', error);
      throw error;
    }
    
    console.log('Successfully inserted RSU trust events:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Failed to create RSU trust events:', error);
    throw error;
  }
};

// Create anomalies in the anomalies table
export const createAnomalies = async (anomalies: RsuAnomaly[]): Promise<any[]> => {
  try {
    console.log('Inserting anomalies:', anomalies.length);
    
    const { data, error } = await supabaseClient
      .from('anomalies')
      .insert(anomalies)
      .select();
    
    if (error) {
      console.error('Error inserting anomalies:', error);
      throw error;
    }
    
    console.log('Successfully inserted anomalies:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Failed to create anomalies:', error);
    throw error;
  }
};

// Fetch RSU trust ledger data
export const fetchRsuTrustEvents = async (options: { limit?: number } = {}): Promise<RsuTrustEvent[]> => {
  try {
    let query = supabaseClient
      .from('rsu_trust_ledger')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching RSU trust events:', error);
      throw error;
    }
    
    console.log('Fetched RSU trust events:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Failed to fetch RSU trust events:', error);
    throw error;
  }
};

// Fetch anomalies with RSU filter
export const fetchRsuAnomalies = async (options: { limit?: number } = {}): Promise<RsuAnomaly[]> => {
  try {
    let query = supabaseClient
      .from('anomalies')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching anomalies:', error);
      throw error;
    }
    
    console.log('Fetched anomalies:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Failed to fetch anomalies:', error);
    throw error;
  }
};
