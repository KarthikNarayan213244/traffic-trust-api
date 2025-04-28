
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate a random vehicle ID
function generateVehicleId() {
  const series = ["TS07", "TS08", "TS09", "TS10", "TS11", "TS12", "TS13"];
  const randomSeries = series[Math.floor(Math.random() * series.length)];
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);
  const randomChars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                     String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  return `${randomSeries}-${randomNumbers}-${randomChars}`;
}

// Function to generate a random name
function generateRandomName() {
  const firstNames = ["Raj", "Priya", "Amit", "Sunita", "Vikram", "Ananya", "Karan", "Deepa", 
                      "Arjun", "Meera", "Sanjay", "Neha", "Rahul", "Pooja", "Vijay", "Kavita"];
  const lastNames = ["Kumar", "Sharma", "Patel", "Reddy", "Singh", "Gupta", "Das", "Joshi", 
                     "Nair", "Verma", "Malhotra", "Rao", "Kapoor", "Chopra", "Mehta", "Iyer"];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Generate mock vehicles with realistic Hyderabad data
function generateMockVehicles(count: number) {
  const vehicles = [];
  
  // Hyderabad major areas with realistic coordinates
  const hyderabadAreas = [
    { name: "Hitech City", lat: 17.4435, lng: 78.3772 },
    { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
    { name: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
    { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
    { name: "KPHB", lat: 17.4800, lng: 78.3940 },
    { name: "Madhapur", lat: 17.4479, lng: 78.3915 },
    { name: "Jubilee Hills", lat: 17.4325, lng: 78.4073 },
    { name: "Kukatpally", lat: 17.4849, lng: 78.4113 },
    { name: "Ameerpet", lat: 17.4374, lng: 78.4487 },
    { name: "LB Nagar", lat: 17.3457, lng: 78.5466 },
    { name: "Dilsukhnagar", lat: 17.3687, lng: 78.5262 },
    { name: "Begumpet", lat: 17.4439, lng: 78.4630 },
    { name: "Abids", lat: 17.3899, lng: 78.4746 },
    { name: "Charminar", lat: 17.3616, lng: 78.4747 },
    { name: "Uppal", lat: 17.4012, lng: 78.5595 }
  ];
  
  const vehicleTypes = ["Car", "Truck", "Bus", "Two-Wheeler", "Auto-Rickshaw", "Taxi", "Ambulance", "Police Vehicle"];
  
  for (let i = 0; i < count; i++) {
    // Choose a random area
    const area = hyderabadAreas[Math.floor(Math.random() * hyderabadAreas.length)];
    
    // Add small random offset to create realistic distribution
    const latVariation = (Math.random() * 0.02) - 0.01;
    const lngVariation = (Math.random() * 0.02) - 0.01;
    
    const vehicle = {
      vehicle_id: generateVehicleId(),
      owner_name: generateRandomName(),
      vehicle_type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      trust_score: Math.floor(60 + Math.random() * 41), // 60-100
      lat: area.lat + latVariation,
      lng: area.lng + lngVariation,
      speed: Math.floor(10 + Math.random() * 70), // 10-80 km/h
      heading: Math.floor(Math.random() * 360),
      location: area.name,
      status: Math.random() > 0.05 ? "Active" : "Inactive" // 5% chance of being inactive
    };
    vehicles.push(vehicle);
  }
  
  return vehicles;
}

// Generate mock RSUs with realistic Hyderabad data
function generateMockRSUs(count: number) {
  const rsus = [];
  
  // Strategic locations for RSUs in Hyderabad
  const locations = [
    { name: "Hitech City Junction", lat: 17.4435, lng: 78.3772 },
    { name: "Gachibowli Flyover", lat: 17.4401, lng: 78.3489 },
    { name: "Mindspace Junction", lat: 17.4344, lng: 78.3826 },
    { name: "Banjara Hills Road No. 12", lat: 17.4156, lng: 78.4347 },
    { name: "Secunderabad Clock Tower", lat: 17.4399, lng: 78.4983 },
    { name: "KPHB Phase 1", lat: 17.4800, lng: 78.3940 },
    { name: "Madhapur Main Road", lat: 17.4479, lng: 78.3915 },
    { name: "Jubilee Hills Check Post", lat: 17.4325, lng: 78.4073 },
    { name: "Kukatpally Y Junction", lat: 17.4849, lng: 78.4113 },
    { name: "Ameerpet Metro Station", lat: 17.4374, lng: 78.4487 },
    { name: "LB Nagar Circle", lat: 17.3457, lng: 78.5466 },
    { name: "Dilsukhnagar Bus Stand", lat: 17.3687, lng: 78.5262 },
    { name: "Begumpet Railway Station", lat: 17.4439, lng: 78.4630 },
    { name: "Abids GPO", lat: 17.3899, lng: 78.4746 },
    { name: "Charminar Pedestrian Zone", lat: 17.3616, lng: 78.4747 },
    { name: "Uppal X Roads", lat: 17.4012, lng: 78.5595 },
    { name: "Mehdipatnam Bus Terminal", lat: 17.3938, lng: 78.4350 },
    { name: "Panjagutta Circle", lat: 17.4236, lng: 78.4475 },
    { name: "Paradise Circle", lat: 17.4417, lng: 78.4992 },
    { name: "Basheerbagh Junction", lat: 17.4000, lng: 78.4769 }
  ];
  
  // Use strategic locations first, then generate random ones if needed
  for (let i = 0; i < count; i++) {
    let location, lat, lng;
    
    if (i < locations.length) {
      location = locations[i].name;
      lat = locations[i].lat;
      lng = locations[i].lng;
    } else {
      // Generate random locations around Hyderabad if we need more
      const centerLat = 17.3850;
      const centerLng = 78.4867;
      location = `RSU Location #${i+1}`;
      lat = centerLat + (Math.random() * 0.15 - 0.075);
      lng = centerLng + (Math.random() * 0.15 - 0.075);
    }
    
    const rsu = {
      rsu_id: `RSU-${1000 + i}`,
      location: location,
      status: Math.random() > 0.1 ? "Active" : "Inactive", // 10% chance of being inactive
      coverage_radius: Math.floor(300 + Math.random() * 700), // 300-1000m radius
      lat: lat,
      lng: lng,
      last_seen: new Date().toISOString()
    };
    rsus.push(rsu);
  }
  
  return rsus;
}

// Generate mock anomalies
function generateMockAnomalies(count: number, vehicleIds: string[]) {
  const anomalies = [];
  const types = [
    "Speed Violation", 
    "Signal Tampering", 
    "Unauthorized Access", 
    "GPS Spoofing", 
    "Communication Error",
    "Erratic Driving Pattern",
    "License Plate Mismatch",
    "Toll Evasion",
    "Restricted Zone Entry",
    "Traffic Signal Violation"
  ];
  
  const severities = ["Low", "Medium", "High", "Critical"];
  const statuses = ["Detected", "Under Investigation", "Resolved", "False Alarm"];
  
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  for (let i = 0; i < count; i++) {
    // Generate a random timestamp within the last week
    const randomTime = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const vehicleId = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
    
    // Generate specific messages based on type
    let message;
    switch (type) {
      case "Speed Violation":
        message = `Vehicle exceeded speed limit by ${Math.floor(10 + Math.random() * 40)} km/h`;
        break;
      case "Signal Tampering":
        message = `Unusual signal pattern detected from vehicle transponder`;
        break;
      case "Unauthorized Access":
        message = `Unauthorized attempt to access vehicle control systems`;
        break;
      case "GPS Spoofing":
        message = `GPS location inconsistent with RSU detections`;
        break;
      case "Communication Error":
        message = `Vehicle failed to respond to ${Math.floor(2 + Math.random() * 5)} consecutive RSU pings`;
        break;
      case "Erratic Driving Pattern":
        message = `Vehicle performed ${Math.floor(2 + Math.random() * 3)} unexpected lane changes in quick succession`;
        break;
      case "License Plate Mismatch":
        message = `Optical recognition shows different plate than registered transponder ID`;
        break;
      case "Toll Evasion":
        message = `Vehicle passed through toll zone without valid payment`;
        break;
      case "Restricted Zone Entry":
        message = `Vehicle entered restricted zone without authorization`;
        break;
      case "Traffic Signal Violation":
        message = `Vehicle crossed intersection during red signal phase`;
        break;
      default:
        message = `Anomaly detected at ${randomTime.toLocaleTimeString()}`;
    }
    
    const anomaly = {
      timestamp: randomTime.toISOString(),
      vehicle_id: vehicleId,
      type: type,
      severity: severity,
      message: message,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    };
    anomalies.push(anomaly);
  }
  
  return anomalies;
}

// Generate mock trust ledger entries
function generateMockTrustLedger(count: number, vehicleIds: string[]) {
  const trustLedger = [];
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const actions = [
    "Trust Score Update",
    "Good Driving Behavior",
    "Traffic Rule Violation",
    "Vehicle Registration",
    "Annual Inspection Passed",
    "Verified Documentation",
    "RSU Verification Success",
    "Blockchain Attestation",
    "Emergency Vehicle Priority"
  ];
  
  for (let i = 0; i < count; i++) {
    // Generate a random timestamp within the last month
    const randomTime = new Date(oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime()));
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    let oldValue, newValue, details;
    
    switch (action) {
      case "Trust Score Update":
        oldValue = Math.floor(50 + Math.random() * 50);
        newValue = Math.max(0, Math.min(100, oldValue + (Math.random() > 0.5 ? 1 : -1) * Math.floor(1 + Math.random() * 5)));
        details = newValue > oldValue ? "Regular trust score increase" : "Minor trust score adjustment";
        break;
      case "Good Driving Behavior":
        oldValue = Math.floor(50 + Math.random() * 45);
        newValue = Math.min(100, oldValue + Math.floor(1 + Math.random() * 3));
        details = "Consistent adherence to traffic regulations";
        break;
      case "Traffic Rule Violation":
        oldValue = Math.floor(60 + Math.random() * 40);
        newValue = Math.max(0, oldValue - Math.floor(3 + Math.random() * 5));
        details = "Violation detected by traffic monitoring system";
        break;
      case "Vehicle Registration":
        oldValue = 0;
        newValue = 80;
        details = "Initial trust score assigned at registration";
        break;
      case "Annual Inspection Passed":
        oldValue = Math.floor(70 + Math.random() * 20);
        newValue = Math.min(100, oldValue + Math.floor(1 + Math.random() * 3));
        details = "Vehicle passed all safety and emissions tests";
        break;
      case "Verified Documentation":
        oldValue = Math.floor(75 + Math.random() * 15);
        newValue = Math.min(100, oldValue + Math.floor(1 + Math.random() * 2));
        details = "All vehicle documentation verified as authentic";
        break;
      case "RSU Verification Success":
        oldValue = Math.floor(80 + Math.random() * 15);
        newValue = Math.min(100, oldValue + 1);
        details = "Vehicle identity confirmed by roadside unit network";
        break;
      case "Blockchain Attestation":
        oldValue = Math.floor(85 + Math.random() * 10);
        newValue = Math.min(100, oldValue + 2);
        details = "Trust verification recorded on public blockchain";
        break;
      case "Emergency Vehicle Priority":
        oldValue = Math.floor(90 + Math.random() * 5);
        newValue = 99;
        details = "Emergency service vehicle status confirmed";
        break;
      default:
        oldValue = Math.floor(50 + Math.random() * 50);
        newValue = Math.floor(50 + Math.random() * 50);
        details = "Standard trust update";
    }
    
    // Generate a transaction ID that looks like an Ethereum tx hash
    const txId = "0x" + Array.from({length: 40}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    
    const entry = {
      tx_id: txId,
      timestamp: randomTime.toISOString(),
      vehicle_id: vehicleIds[Math.floor(Math.random() * vehicleIds.length)],
      action: action,
      old_value: oldValue,
      new_value: newValue,
      details: details
    };
    trustLedger.push(entry);
  }
  
  // Sort by timestamp (newest first)
  return trustLedger.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Generate mock congestion data with realistic Hyderabad zones
function generateMockCongestion(count: number) {
  const congestionZones = [
    { name: "Hitech City Junction", lat: 17.4435, lng: 78.3772 },
    { name: "Gachibowli Flyover", lat: 17.4401, lng: 78.3489 },
    { name: "Mindspace Junction", lat: 17.4344, lng: 78.3826 },
    { name: "Banjara Hills Road No. 12", lat: 17.4156, lng: 78.4347 },
    { name: "Secunderabad Clock Tower", lat: 17.4399, lng: 78.4983 },
    { name: "KPHB Phase 1", lat: 17.4800, lng: 78.3940 },
    { name: "Madhapur Main Road", lat: 17.4479, lng: 78.3915 },
    { name: "Jubilee Hills Check Post", lat: 17.4325, lng: 78.4073 },
    { name: "Kukatpally Y Junction", lat: 17.4849, lng: 78.4113 },
    { name: "Ameerpet Metro Station", lat: 17.4374, lng: 78.4487 },
    { name: "LB Nagar Circle", lat: 17.3457, lng: 78.5466 },
    { name: "Dilsukhnagar Bus Stand", lat: 17.3687, lng: 78.5262 },
    { name: "Begumpet Railway Station", lat: 17.4439, lng: 78.4630 },
    { name: "Abids GPO", lat: 17.3899, lng: 78.4746 },
    { name: "Charminar Pedestrian Zone", lat: 17.3616, lng: 78.4747 },
    { name: "Uppal X Roads", lat: 17.4012, lng: 78.5595 },
    { name: "Mehdipatnam Bus Terminal", lat: 17.3938, lng: 78.4350 },
    { name: "Panjagutta Circle", lat: 17.4236, lng: 78.4475 },
    { name: "Paradise Circle", lat: 17.4417, lng: 78.4992 },
    { name: "Basheerbagh Junction", lat: 17.4000, lng: 78.4769 }
  ];
  
  const congestion = [];
  const now = new Date();
  
  // Use either the specified count or all defined zones, whichever is smaller
  const zoneCount = Math.min(count, congestionZones.length);
  
  // Morning rush hour time simulation (around 9 AM)
  const morningRushHour = new Date(now);
  morningRushHour.setHours(9, 0, 0, 0);
  
  // Evening rush hour time simulation (around 6 PM)
  const eveningRushHour = new Date(now);
  eveningRushHour.setHours(18, 0, 0, 0);
  
  // Current time in hours
  const currentHour = now.getHours();
  
  for (let i = 0; i < zoneCount; i++) {
    const zone = congestionZones[i];
    
    // Congestion level depends on time of day
    let baseCongestionLevel;
    
    // Simulate higher congestion during rush hours
    if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19)) {
      // Rush hour - higher congestion
      baseCongestionLevel = 70 + Math.floor(Math.random() * 30); // 70-100
    } else if ((currentHour >= 11 && currentHour <= 15) || (currentHour >= 22 || currentHour <= 5)) {
      // Off-peak hours - lower congestion
      baseCongestionLevel = 10 + Math.floor(Math.random() * 30); // 10-40
    } else {
      // Normal hours - moderate congestion
      baseCongestionLevel = 40 + Math.floor(Math.random() * 30); // 40-70
    }
    
    // Key traffic hotspots always have higher congestion
    if (["Hitech City Junction", "Ameerpet Metro Station", "Panjagutta Circle", "LB Nagar Circle"].includes(zone.name)) {
      baseCongestionLevel = Math.min(100, baseCongestionLevel + 15);
    }
    
    const entry = {
      zone_name: zone.name,
      lat: zone.lat,
      lng: zone.lng,
      congestion_level: baseCongestionLevel,
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
    // Get request parameters
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // If JSON parsing fails, use an empty object
      console.error("Failed to parse request body", e);
    }
    
    const clearExisting = body.clear === true;
    const vehicleCount = parseInt(body.vehicles) || 1000;
    const rsuCount = parseInt(body.rsus) || 200;
    const anomalyCount = parseInt(body.anomalies) || 1000;
    const trustCount = parseInt(body.trustEntries) || 1000;
    const congestionCount = parseInt(body.congestionEntries) || 20;
    
    console.log(`Processing seed request: Clear existing=${clearExisting}, Vehicles=${vehicleCount}, RSUs=${rsuCount}, Anomalies=${anomalyCount}, Trust=${trustCount}, Congestion=${congestionCount}`);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Supabase client created");

    // Clear existing data if requested
    if (clearExisting) {
      console.log("Clearing existing data...");
      await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('rsus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('anomalies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('trust_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('zones_congestion').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log("Existing data cleared");
    }

    // Generate vehicles
    console.log(`Generating ${vehicleCount} vehicles...`);
    const vehicles = generateMockVehicles(vehicleCount);
    const { error: vehiclesError } = await supabase.from('vehicles').insert(vehicles);
    if (vehiclesError) {
      console.error("Error inserting vehicles:", vehiclesError);
      throw new Error(`Error inserting vehicles: ${vehiclesError.message}`);
    }
    console.log(`Successfully inserted ${vehicles.length} vehicles`);
    
    // Generate RSUs
    console.log(`Generating ${rsuCount} RSUs...`);
    const rsus = generateMockRSUs(rsuCount);
    const { error: rsusError } = await supabase.from('rsus').insert(rsus);
    if (rsusError) {
      console.error("Error inserting RSUs:", rsusError);
      throw new Error(`Error inserting RSUs: ${rsusError.message}`);
    }
    console.log(`Successfully inserted ${rsus.length} RSUs`);
    
    // Extract vehicle IDs for reference
    const vehicleIds = vehicles.map(v => v.vehicle_id);
    
    // Generate anomalies
    console.log(`Generating ${anomalyCount} anomalies...`);
    const anomalies = generateMockAnomalies(anomalyCount, vehicleIds);
    
    // Insert anomalies in batches to avoid timeout
    const BATCH_SIZE = 200;
    for (let i = 0; i < anomalies.length; i += BATCH_SIZE) {
      const batch = anomalies.slice(i, i + BATCH_SIZE);
      const { error: anomaliesError } = await supabase.from('anomalies').insert(batch);
      if (anomaliesError) {
        console.error(`Error inserting anomalies batch ${i/BATCH_SIZE + 1}:`, anomaliesError);
        throw new Error(`Error inserting anomalies: ${anomaliesError.message}`);
      }
      console.log(`Successfully inserted batch ${i/BATCH_SIZE + 1} of anomalies (${batch.length} records)`);
    }
    
    // Generate trust ledger entries
    console.log(`Generating ${trustCount} trust ledger entries...`);
    const trustEntries = generateMockTrustLedger(trustCount, vehicleIds);
    
    // Insert trust entries in batches
    for (let i = 0; i < trustEntries.length; i += BATCH_SIZE) {
      const batch = trustEntries.slice(i, i + BATCH_SIZE);
      const { error: trustError } = await supabase.from('trust_ledger').insert(batch);
      if (trustError) {
        console.error(`Error inserting trust ledger batch ${i/BATCH_SIZE + 1}:`, trustError);
        throw new Error(`Error inserting trust ledger entries: ${trustError.message}`);
      }
      console.log(`Successfully inserted batch ${i/BATCH_SIZE + 1} of trust ledger entries (${batch.length} records)`);
    }
    
    // Generate congestion data
    console.log(`Generating ${congestionCount} congestion entries...`);
    const congestionEntries = generateMockCongestion(congestionCount);
    const { error: congestionError } = await supabase.from('zones_congestion').insert(congestionEntries);
    if (congestionError) {
      console.error("Error inserting congestion data:", congestionError);
      throw new Error(`Error inserting congestion data: ${congestionError.message}`);
    }
    console.log(`Successfully inserted ${congestionEntries.length} congestion entries`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database seeded successfully",
        counts: {
          vehicles: vehicles.length,
          rsus: rsus.length,
          anomalies: anomalies.length,
          trustEntries: trustEntries.length,
          congestionEntries: congestionEntries.length
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
        message: error.message || "Unknown error occurred"
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
