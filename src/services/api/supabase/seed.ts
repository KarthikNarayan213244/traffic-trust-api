
import { supabase } from "./client";
import { toast } from "@/hooks/use-toast";

// Update utility function to seed only trust and anomaly data
export async function seedDatabaseWithTestData(clearExisting = false) {
  try {
    console.log("Starting database seeding process for trust and anomaly data...");
    toast({
      title: "Seeding trust database",
      description: "Please wait while we populate the database with trust and anomaly test data...",
    });
    
    // Get the full URL for the edge function
    const supabaseUrl = 'https://ompvafpbdbwsmelomnla.supabase.co';
    const url = `${supabaseUrl}/functions/v1/seed-data`;
    console.log(`Sending request to: ${url}`);
    
    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
    } else {
      console.log("No authentication token available, proceeding without authentication");
    }
    
    // Note: We're only seeding trust and anomaly data, not traffic data
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clear: clearExisting,
        seedTraffic: false, // Don't seed traffic data
        seedTrustOnly: true, // Only seed trust and anomaly data
        vehicles: 0, // No traffic vehicles
        rsus: 0, // No RSUs
        anomalies: 1000, // Trust-related anomalies only
        trustEntries: 1000, // Trust ledger entries
        congestionEntries: 0 // No congestion data
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Seeding failed with status: ${response.status}`, errorText);
      toast({
        title: "Trust Database Seeding Failed",
        description: `Error: ${response.status}. Please check console for details.`,
        variant: "destructive",
      });
      
      return {
        success: false,
        message: "Seeding failed",
        counts: {
          vehicles: 0,
          rsus: 0,
          anomalies: 0,
          trustEntries: 0,
          congestionEntries: 0
        }
      };
    }
    
    const result = await response.json();
    console.log("Seeding completed successfully:", result);
    toast({
      title: "Trust Database Seeded Successfully",
      description: `Added ${result.counts?.trustEntries || 'many'} trust entries and ${result.counts?.anomalies || 'many'} anomalies to the database.`,
    });
    return result;
  } catch (error: any) {
    console.error('Error seeding database:', error);
    toast({
      title: "Database Seeding Failed",
      description: `Error: ${error.message || "Unknown error"}. Please try again or check console for details.`,
      variant: "destructive",
    });
    
    // Return a default object that can be handled by the calling code
    return {
      success: false,
      message: error.message || "Unknown error occurred",
      counts: {
        vehicles: 0,
        rsus: 0,
        anomalies: 0,
        trustEntries: 0,
        congestionEntries: 0
      }
    };
  }
}
