
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate a random vehicle ID
function generateVehicleId() {
  const series = ["TS07", "TS08", "TS09", "TS10"];
  const randomSeries = series[Math.floor(Math.random() * series.length)];
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);
  const randomChars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                     String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  return `${randomSeries}-${randomNumbers}-${randomChars}`;
}

// Function to generate a random name
function generateRandomName() {
  const firstNames = ["Raj", "Priya", "Amit", "Sunita", "Vikram", "Ananya", "Karan", "Deepa", "Arjun", "Meera"];
  const lastNames = ["Kumar", "Sharma", "Patel", "Reddy", "Singh", "Gupta", "Das", "Joshi", "Nair", "Verma"];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Generate mock vehicles
function generateMockVehicles(count: number) {
  const vehicles = [];
  // Hyderabad coordinates
  const centerLat = 17.3850;
  const centerLng = 78.4867;
  
  for (let i = 0; i < count; i++) {
    const vehicle = {
      vehicle_id: generateVehicleId(),
      owner_name: generateRandomName(),
      vehicle_type: ["Car", "Truck", "Bus", "Two-Wheeler"][Math.floor(Math.random() * 4)],
      trust_score: Math.floor(60 + Math.random() * 41), // 60-100
      lat: centerLat + (Math.random() * 0.1 - 0.05),
      lng: centerLng + (Math.random() * 0.1 - 0.05),
      speed: Math.floor(20 + Math.random() * 60),
      heading: Math.floor(Math.random() * 360),
      status: "Active"
    };
    vehicles.push(vehicle);
  }
  
  return vehicles;
}

// Generate mock RSUs
function generateMockRSUs(count: number) {
  const rsus = [];
  // Hyderabad coordinates
  const centerLat = 17.3850;
  const centerLng = 78.4867;
  const locations = ["Hitech City", "Gachibowli", "Banjara Hills", "Secunderabad", "KPHB", "Madhapur", "Jubilee Hills", "Kukatpally"];
  
  for (let i = 0; i < count; i++) {
    const rsu = {
      rsu_id: `RSU-${1000 + i}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      status: Math.random() > 0.2 ? "Active" : "Inactive",
      coverage_radius: Math.floor(300 + Math.random() * 700),
      lat: centerLat + (Math.random() * 0.12 - 0.06),
      lng: centerLng + (Math.random() * 0.12 - 0.06)
    };
    rsus.push(rsu);
  }
  
  return rsus;
}

// Generate mock anomalies
function generateMockAnomalies(count: number, vehicleIds: string[]) {
  const anomalies = [];
  const types = ["Speed Violation", "Signal Tampering", "Unauthorized Access", "GPS Spoofing", "Communication Error"];
  const severities = ["Low", "Medium", "High", "Critical"];
  
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    
    const anomaly = {
      timestamp: timestamp.toISOString(),
      vehicle_id: vehicleIds[Math.floor(Math.random() * vehicleIds.length)],
      type: types[Math.floor(Math.random() * types.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: `Detected unusual activity at ${timestamp.toLocaleTimeString()}`,
      status: "Detected"
    };
    anomalies.push(anomaly);
  }
  
  return anomalies;
}

// Generate mock trust ledger entries
function generateMockTrustLedger(count: number, vehicleIds: string[]) {
  const trustLedger = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    const oldValue = Math.floor(50 + Math.random() * 50);
    const valueChange = Math.floor(Math.random() * 20) - 10;
    const newValue = Math.max(0, Math.min(100, oldValue + valueChange));
    
    const entry = {
      tx_id: `TX${100000 + i}`,
      timestamp: timestamp.toISOString(),
      vehicle_id: vehicleIds[Math.floor(Math.random() * vehicleIds.length)],
      action: "Trust Score Update",
      old_value: oldValue,
      new_value: newValue,
      details: valueChange >= 0 ? "Positive driving behavior" : "Traffic violation detected"
    };
    trustLedger.push(entry);
  }
  
  return trustLedger;
}

// Generate mock congestion data
function generateMockCongestion(count: number) {
  const congestion = [];
  const zones = [
    { name: "Hitech City", lat: 17.4435, lng: 78.3772 },
    { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
    { name: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
    { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
    { name: "KPHB", lat: 17.4800, lng: 78.3940 },
    { name: "Madhapur", lat: 17.4479, lng: 78.3915 },
    { name: "Jubilee Hills", lat: 17.4325, lng: 78.4073 },
    { name: "Kukatpally", lat: 17.4849, lng: 78.4113 }
  ];
  
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const zone = zones[i % zones.length];
    const congestionLevel = Math.floor(Math.random() * 10) + 1; // 1-10
    
    const entry = {
      zone_name: zone.name,
      lat: zone.lat,
      lng: zone.lng,
      congestion_level: congestionLevel * 10, // Convert to 10-100 scale
      updated_at: now.toISOString()
    };
    congestion.push(entry);
  }
  
  return congestion;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the query parameters
    const url = new URL(req.url);
    const clearExisting = url.searchParams.get('clear') === 'true';
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear existing data if requested
    if (clearExisting) {
      console.log("Clearing existing data...");
      await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('rsus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('anomalies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('trust_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('zones_congestion').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Generate vehicles
    const vehicleCount = 50;
    const vehicles = generateMockVehicles(vehicleCount);
    const { error: vehiclesError } = await supabase.from('vehicles').insert(vehicles);
    if (vehiclesError) throw new Error(`Error inserting vehicles: ${vehiclesError.message}`);
    
    // Generate RSUs
    const rsuCount = 20;
    const rsus = generateMockRSUs(rsuCount);
    const { error: rsusError } = await supabase.from('rsus').insert(rsus);
    if (rsusError) throw new Error(`Error inserting RSUs: ${rsusError.message}`);
    
    // Extract vehicle IDs for reference
    const vehicleIds = vehicles.map(v => v.vehicle_id);
    
    // Generate anomalies
    const anomalyCount = 100;
    const anomalies = generateMockAnomalies(anomalyCount, vehicleIds);
    const { error: anomaliesError } = await supabase.from('anomalies').insert(anomalies);
    if (anomaliesError) throw new Error(`Error inserting anomalies: ${anomaliesError.message}`);
    
    // Generate trust ledger entries
    const trustCount = 200;
    const trustEntries = generateMockTrustLedger(trustCount, vehicleIds);
    const { error: trustError } = await supabase.from('trust_ledger').insert(trustEntries);
    if (trustError) throw new Error(`Error inserting trust ledger entries: ${trustError.message}`);
    
    // Generate congestion data
    const congestionCount = 8; // One for each major zone
    const congestionEntries = generateMockCongestion(congestionCount);
    const { error: congestionError } = await supabase.from('zones_congestion').insert(congestionEntries);
    if (congestionError) throw new Error(`Error inserting congestion data: ${congestionError.message}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database seeded successfully",
        counts: {
          vehicles: vehicleCount,
          rsus: rsuCount,
          anomalies: anomalyCount,
          trustEntries: trustCount,
          congestionEntries: congestionCount
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("Error seeding database:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
