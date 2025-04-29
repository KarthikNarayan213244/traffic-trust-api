
import { supabase } from "./client";
import { toast } from "@/hooks/use-toast";

interface SeedOptions {
  vehicles?: number;
  rsus?: number;
  anomalies?: number; 
  trustEntries?: number;
  congestionEntries?: number;
}

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false, options: SeedOptions = {}) {
  try {
    console.log("Starting database seeding process...");
    toast({
      title: "Seeding database",
      description: "Please wait while we populate the database with test data...",
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
    
    // Set default values for options
    const {
      vehicles = 10000,
      rsus = 200,
      anomalies = 1000,
      trustEntries = 1000,
      congestionEntries = 50
    } = options;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clear: clearExisting,
        vehicles,
        rsus,
        anomalies,
        trustEntries,
        congestionEntries
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Seeding failed with status: ${response.status}`, errorText);
      toast({
        title: "Database Seeding Failed",
        description: `Error: ${response.status}. Please check console for details.`,
        variant: "destructive",
      });
      
      // Fall back to mock data
      console.log("Falling back to mock data generation");
      return {
        success: false,
        message: "Seeding failed, using mock data",
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
      title: "Database Seeded Successfully",
      description: `Added ${result.counts?.vehicles.toLocaleString() || 'many'} vehicles, ${result.counts?.rsus.toLocaleString() || 'many'} RSUs, and more data to the database.`,
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
