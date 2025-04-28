
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
import { toast } from "@/hooks/use-toast";

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false): Promise<any> {
  try {
    toast({
      title: "Seeding database",
      description: "Please wait while we populate the database with test data...",
    });
    
    const url = new URL(`${window.location.origin}/functions/v1/seed-data`);
    if (clearExisting) {
      url.searchParams.append('clear', 'true');
    }
    
    // Higher number of records for more realistic data
    url.searchParams.append('vehicles', '10000');
    url.searchParams.append('rsus', '500');
    url.searchParams.append('anomalies', '2000');
    url.searchParams.append('congestion', '1000');
    url.searchParams.append('trust', '3000');
    
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
      const errorText = await response.text();
      throw new Error(`Seeding failed with status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    toast({
      title: "Database Seeded Successfully",
      description: `Added ${result.counts?.vehicles || 'many'} vehicles, ${result.counts?.rsus || 'many'} RSUs, ${result.counts?.anomalies || 'many'} anomalies, and more.`,
    });
    
    return result;
  } catch (error) {
    console.error('Error seeding database:', error);
    toast({
      title: "Database Seeding Failed",
      description: `Error: ${error.message || 'Unknown error'}. Please try again.`,
      variant: "destructive",
    });
    throw error;
  }
}
