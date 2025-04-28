
// Export all API functions
export * from './types';
export * from './config';
export * from './vehicles';
export * from './rsus';
export * from './anomalies';
export * from './trustLedger';
export * from './congestion';
export * from './supabase';

import { Vehicle, Rsu, Anomaly, TrustLedgerEntry, CongestionZone } from './types';
import { supabase } from "@/integrations/supabase/client";

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false): Promise<any> {
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
