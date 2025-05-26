
import { supabaseClient } from "./client";
import { toast } from "@/hooks/use-toast";

// Add a utility function to seed the database
export async function seedDatabaseWithTestData(clearExisting = false) {
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
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (sessionData?.session?.access_token) {
      headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      console.log("Using authentication token");
    } else {
      console.log("No authentication token available, proceeding without authentication");
    }
    
    const requestBody = {
      clear: clearExisting,
      vehicles: 1000,
      rsus: 200,
      anomalies: 1000,
      trustEntries: 1000,
      congestionEntries: 50
    };
    
    console.log("Request body:", requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Seeding failed with status: ${response.status}`, errorText);
      
      // Try direct database seeding as fallback
      console.log("Edge function failed, trying direct database seeding...");
      const fallbackResult = await seedDirectly(clearExisting);
      
      toast({
        title: "Database Seeded (Fallback)",
        description: `Added data using fallback method. Check the dashboard for results.`,
      });
      
      return fallbackResult;
    }
    
    const result = await response.json();
    console.log("Seeding completed successfully:", result);
    
    toast({
      title: "Database Seeded Successfully",
      description: `Added ${result.counts?.vehicles || 'many'} vehicles, ${result.counts?.rsus || 'many'} RSUs, and more data to the database.`,
    });
    
    return result;
  } catch (error: any) {
    console.error('Error seeding database:', error);
    
    // Try direct database seeding as fallback
    console.log("Trying direct database seeding as fallback...");
    try {
      const fallbackResult = await seedDirectly(clearExisting);
      
      toast({
        title: "Database Seeded (Fallback)",
        description: `Added data using direct method. Check the dashboard for results.`,
      });
      
      return fallbackResult;
    } catch (fallbackError) {
      console.error('Fallback seeding also failed:', fallbackError);
      
      toast({
        title: "Database Seeding Failed",
        description: `Error: ${error.message || "Unknown error"}. Please try again.`,
        variant: "destructive",
      });
      
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
}

// Direct database seeding fallback
async function seedDirectly(clearExisting: boolean) {
  console.log("Starting direct database seeding...");
  
  if (clearExisting) {
    console.log("Clearing existing data...");
    await Promise.all([
      supabaseClient.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseClient.from('rsus').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseClient.from('anomalies').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseClient.from('trust_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseClient.from('zones_congestion').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseClient.from('rsu_trust_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabaseClient.from('vehicle_trust_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ]);
  }
  
  // Generate sample vehicles
  const vehicles = generateSampleVehicles(100);
  console.log("Generated vehicles:", vehicles.length);
  
  const { data: vehicleData, error: vehicleError } = await supabaseClient
    .from('vehicles')
    .insert(vehicles)
    .select();
  
  if (vehicleError) {
    console.error("Error inserting vehicles:", vehicleError);
  } else {
    console.log("Successfully inserted vehicles:", vehicleData?.length);
  }
  
  // Generate sample RSUs
  const rsus = generateSampleRSUs(20);
  console.log("Generated RSUs:", rsus.length);
  
  const { data: rsuData, error: rsuError } = await supabaseClient
    .from('rsus')
    .insert(rsus)
    .select();
  
  if (rsuError) {
    console.error("Error inserting RSUs:", rsuError);
  } else {
    console.log("Successfully inserted RSUs:", rsuData?.length);
  }
  
  // Generate sample anomalies
  const vehicleIds = vehicles.map(v => v.vehicle_id);
  const anomalies = generateSampleAnomalies(50, vehicleIds);
  console.log("Generated anomalies:", anomalies.length);
  
  const { data: anomalyData, error: anomalyError } = await supabaseClient
    .from('anomalies')
    .insert(anomalies)
    .select();
  
  if (anomalyError) {
    console.error("Error inserting anomalies:", anomalyError);
  } else {
    console.log("Successfully inserted anomalies:", anomalyData?.length);
  }
  
  // Generate trust ledger entries
  const trustEntries = generateSampleTrustEntries(30, vehicleIds);
  console.log("Generated trust entries:", trustEntries.length);
  
  const { data: trustData, error: trustError } = await supabaseClient
    .from('trust_ledger')
    .insert(trustEntries)
    .select();
  
  if (trustError) {
    console.error("Error inserting trust entries:", trustError);
  } else {
    console.log("Successfully inserted trust entries:", trustData?.length);
  }
  
  // Generate congestion data
  const congestion = generateSampleCongestion(10);
  console.log("Generated congestion data:", congestion.length);
  
  const { data: congestionData, error: congestionError } = await supabaseClient
    .from('zones_congestion')
    .insert(congestion)
    .select();
  
  if (congestionError) {
    console.error("Error inserting congestion data:", congestionError);
  } else {
    console.log("Successfully inserted congestion data:", congestionData?.length);
  }
  
  return {
    success: true,
    message: "Direct seeding completed",
    counts: {
      vehicles: vehicleData?.length || 0,
      rsus: rsuData?.length || 0,
      anomalies: anomalyData?.length || 0,
      trustEntries: trustData?.length || 0,
      congestionEntries: congestionData?.length || 0
    }
  };
}

function generateSampleVehicles(count: number) {
  const vehicles = [];
  const types = ['Car', 'Truck', 'Bus', 'Two-Wheeler', 'Auto-Rickshaw'];
  const names = ['Raj Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Reddy', 'Vikram Singh'];
  
  for (let i = 0; i < count; i++) {
    vehicles.push({
      vehicle_id: `TS07${1000 + i}AB`,
      owner_name: names[Math.floor(Math.random() * names.length)],
      vehicle_type: types[Math.floor(Math.random() * types.length)],
      trust_score: Math.floor(60 + Math.random() * 41),
      lat: 17.3850 + (Math.random() * 0.15 - 0.075),
      lng: 78.4867 + (Math.random() * 0.15 - 0.075),
      speed: Math.floor(10 + Math.random() * 70),
      heading: Math.floor(Math.random() * 360),
      location: 'Hyderabad',
      status: Math.random() > 0.1 ? 'Active' : 'Inactive'
    });
  }
  
  return vehicles;
}

function generateSampleRSUs(count: number) {
  const rsus = [];
  const locations = [
    'Hitech City Junction', 'Gachibowli Flyover', 'Banjara Hills', 'Secunderabad',
    'KPHB Phase 1', 'Madhapur', 'Jubilee Hills', 'Kukatpally', 'Ameerpet', 'LB Nagar'
  ];
  
  for (let i = 0; i < count; i++) {
    rsus.push({
      rsu_id: `RSU-${1000 + i}`,
      location: locations[i % locations.length],
      status: Math.random() > 0.1 ? 'Active' : 'Inactive',
      coverage_radius: Math.floor(300 + Math.random() * 700),
      lat: 17.3850 + (Math.random() * 0.15 - 0.075),
      lng: 78.4867 + (Math.random() * 0.15 - 0.075)
    });
  }
  
  return rsus;
}

function generateSampleAnomalies(count: number, vehicleIds: string[]) {
  const anomalies = [];
  const types = ['Speed Violation', 'Signal Tampering', 'GPS Spoofing', 'Communication Error'];
  const severities = ['Low', 'Medium', 'High', 'Critical'];
  
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const randomTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    
    anomalies.push({
      timestamp: randomTime.toISOString(),
      vehicle_id: vehicleIds[Math.floor(Math.random() * vehicleIds.length)],
      type: types[Math.floor(Math.random() * types.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: `Anomaly detected at ${randomTime.toLocaleTimeString()}`,
      status: 'Detected'
    });
  }
  
  return anomalies;
}

function generateSampleTrustEntries(count: number, vehicleIds: string[]) {
  const entries = [];
  const actions = ['Trust Score Update', 'Vehicle Registration', 'Good Driving Behavior'];
  
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const randomTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const oldValue = Math.floor(50 + Math.random() * 50);
    const newValue = Math.max(0, Math.min(100, oldValue + (Math.random() > 0.5 ? 1 : -1) * Math.floor(1 + Math.random() * 5)));
    
    entries.push({
      tx_id: "0x" + Array.from({length: 40}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      timestamp: randomTime.toISOString(),
      vehicle_id: vehicleIds[Math.floor(Math.random() * vehicleIds.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      old_value: oldValue,
      new_value: newValue,
      details: 'Trust score updated based on driving behavior'
    });
  }
  
  return entries;
}

function generateSampleCongestion(count: number) {
  const congestion = [];
  const zones = [
    'Hitech City', 'Gachibowli', 'Banjara Hills', 'Secunderabad', 'KPHB',
    'Madhapur', 'Jubilee Hills', 'Kukatpally', 'Ameerpet', 'LB Nagar'
  ];
  
  for (let i = 0; i < count; i++) {
    congestion.push({
      zone_name: zones[i % zones.length],
      lat: 17.3850 + (Math.random() * 0.15 - 0.075),
      lng: 78.4867 + (Math.random() * 0.15 - 0.075),
      congestion_level: Math.floor(10 + Math.random() * 90),
      updated_at: new Date().toISOString()
    });
  }
  
  return congestion;
}
