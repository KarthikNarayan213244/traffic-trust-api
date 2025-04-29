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
                      "Arjun", "Meera", "Sanjay", "Neha", "Rahul", "Pooja", "Vijay", "Kavita",
                      "Aditya", "Shreya", "Rohan", "Nisha", "Gaurav", "Divya", "Ajay", "Ritu",
                      "Sachin", "Swati", "Vivek", "Anjali", "Alok", "Anita", "Manish", "Preeti"];
  const lastNames = ["Kumar", "Sharma", "Patel", "Reddy", "Singh", "Gupta", "Das", "Joshi", 
                     "Nair", "Verma", "Malhotra", "Rao", "Kapoor", "Chopra", "Mehta", "Iyer",
                     "Agarwal", "Pillai", "Bhat", "Desai", "Menon", "Shah", "Johar", "Bajaj",
                     "Chatterjee", "Banerjee", "Saxena", "Trivedi", "Chawla", "Khanna", "Basu", "Ganguly"];
  
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
    { name: "Uppal", lat: 17.4012, lng: 78.5595 },
    { name: "Miyapur", lat: 17.4924, lng: 78.3421 },
    { name: "Manikonda", lat: 17.4106, lng: 78.3752 },
    { name: "Shamshabad", lat: 17.2399, lng: 78.4312 },
    { name: "Mehdipatnam", lat: 17.3948, lng: 78.4520 },
    { name: "Paradise Circle", lat: 17.4432, lng: 78.4982 },
    { name: "Punjagutta", lat: 17.4256, lng: 78.4502 },
    { name: "Koti", lat: 17.3824, lng: 78.4800 },
    { name: "Lakdikapul", lat: 17.4066, lng: 78.4625 },
    { name: "Film Nagar", lat: 17.4134, lng: 78.4142 },
    { name: "Kondapur", lat: 17.4609, lng: 78.3610 },
    { name: "Sainikpuri", lat: 17.4945, lng: 78.5466 },
    { name: "Karkhana", lat: 17.4544, lng: 78.5001 },
    { name: "Moosapet", lat: 17.4645, lng: 78.4298 },
    { name: "Malkajgiri", lat: 17.4516, lng: 78.5266 },
    { name: "Bowenpally", lat: 17.4709, lng: 78.4983 }
  ];
  
  const vehicleTypes = [
    { type: "Car", weight: 60 }, 
    { type: "Truck", weight: 10 },
    { type: "Bus", weight: 8 },
    { type: "Two-Wheeler", weight: 18 },
    { type: "Auto-Rickshaw", weight: 8 }, 
    { type: "Taxi", weight: 4 },
    { type: "Ambulance", weight: 1 }, 
    { type: "Police Vehicle", weight: 1 }
  ];
  
  // Generate weighted random selection function
  function weightedRandom(items: { type: string; weight: number }[]): string {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.type;
      }
    }
    
    return items[0].type; // Fallback
  }
  
  // Current time to use as reference
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setHours(now.getHours() - 48);
  
  // Generate historical data points for the last 48 hours
  for (let i = 0; i < count; i++) {
    // Choose a random area with some weighted distribution to create clusters
    const areaIndex = Math.floor(Math.random() * hyderabadAreas.length);
    const area = hyderabadAreas[areaIndex];
    
    // Add small random offset to create realistic distribution
    const latVariation = (Math.random() * 0.02) - 0.01;
    const lngVariation = (Math.random() * 0.02) - 0.01;
    
    // Create a random timestamp within the last 48 hours
    const timestamp = new Date(
      twoDaysAgo.getTime() + Math.random() * (now.getTime() - twoDaysAgo.getTime())
    );
    
    // Get hour of the day to simulate traffic patterns
    const hour = timestamp.getHours();
    
    // Adjust speed based on time of day (rush hours vs. off-peak)
    let speedRange = { min: 20, max: 60 }; // Default
    
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      // Rush hour: slower speeds
      speedRange = { min: 5, max: 40 };
    } else if (hour >= 23 || hour <= 5) {
      // Late night: faster speeds
      speedRange = { min: 30, max: 80 };
    }
    
    const vehicleType = weightedRandom(vehicleTypes);
    const trustScoreBase = vehicleType === "Ambulance" || vehicleType === "Police Vehicle" ? 85 : 60;
    
    const vehicle = {
      vehicle_id: generateVehicleId(),
      owner_name: generateRandomName(),
      vehicle_type: vehicleType,
      trust_score: Math.floor(trustScoreBase + Math.random() * (100 - trustScoreBase)), // Higher base for emergency vehicles
      lat: area.lat + latVariation,
      lng: area.lng + lngVariation,
      speed: Math.floor(speedRange.min + Math.random() * (speedRange.max - speedRange.min)),
      heading: Math.floor(Math.random() * 360),
      location: area.name,
      status: Math.random() > 0.05 ? "Active" : "Inactive", // 5% chance of being inactive
      timestamp: timestamp.toISOString()
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
    { name: "Basheerbagh Junction", lat: 17.4000, lng: 78.4769 },
    { name: "Miyapur Metro Station", lat: 17.4924, lng: 78.3421 },
    { name: "Manikonda Road Junction", lat: 17.4106, lng: 78.3752 },
    { name: "Shamshabad Airport Road", lat: 17.2399, lng: 78.4312 },
    { name: "Malakpet Race Course", lat: 17.3748, lng: 78.5107 },
    { name: "Kachiguda Railway Station", lat: 17.4014, lng: 78.5110 },
    { name: "Tank Bund Road", lat: 17.4227, lng: 78.4698 },
    { name: "Himayat Nagar Road", lat: 17.4064, lng: 78.4766 },
    { name: "Necklace Road", lat: 17.4156, lng: 78.4671 },
    { name: "SR Nagar", lat: 17.4414, lng: 78.4390 },
    { name: "DLF Cybercity", lat: 17.4488, lng: 78.3765 }
  ];
  
  // Add additional strategic junctions at major intersections
  for (let i = 0; i < 70; i++) {
    locations.push({
      name: `Junction ${i+31}`,
      lat: 17.3616 + (Math.random() * 0.2 - 0.1),
      lng: 78.4747 + (Math.random() * 0.2 - 0.1)
    });
  }
  
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
    "Traffic Signal Violation",
    "Unregistered Vehicle",
    "Emergency Braking",
    "Reckless Driving",
    "Improper Lane Change",
    "Unsafe Following Distance"
  ];
  
  const severities = ["Low", "Medium", "High", "Critical"];
  const severityWeights = [0.4, 0.3, 0.2, 0.1]; // Weights for Low, Medium, High, Critical
  const statuses = ["Detected", "Under Investigation", "Resolved", "False Alarm"];
  
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  // Create a weighted random function for severity
  function weightedSeverity() {
    const rand = Math.random();
    let sum = 0;
    
    for (let i = 0; i < severityWeights.length; i++) {
      sum += severityWeights[i];
      if (rand <= sum) return severities[i];
    }
    
    return severities[0]; // Fallback
  }
  
  for (let i = 0; i < count; i++) {
    // Generate a random timestamp within the last week
    const randomTime = new Date(twoDaysAgo.getTime() + Math.random() * (now.getTime() - twoDaysAgo.getTime()));
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = weightedSeverity();
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
      case "Unregistered Vehicle":
        message = `Vehicle detected without valid registration in the system`;
        break;
      case "Emergency Braking":
        message = `Vehicle performed sudden braking, potential hazard detected`;
        break;
      case "Reckless Driving":
        message = `Multiple driving violations detected within short timeframe`;
        break;
      case "Improper Lane Change":
        message = `Vehicle changed lanes without signaling, cutting off other vehicles`;
        break;
      case "Unsafe Following Distance":
        message = `Vehicle following too closely at ${Math.floor(40 + Math.random() * 40)} km/h`;
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
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const actions = [
    "Trust Score Update",
    "Good Driving Behavior",
    "Traffic Rule Violation",
    "Vehicle Registration",
    "Annual Inspection Passed",
    "Verified Documentation",
    "RSU Verification Success",
    "Blockchain Attestation",
    "Emergency Vehicle Priority",
    "Toll Payment Verification",
    "Traffic Signal Compliance",
    "Speed Limit Compliance",
    "Lane Discipline Reward",
    "Junction Cooperation",
    "Incident Reporting"
  ];
  
  for (let i = 0; i < count; i++) {
    // Generate a random timestamp within the last month
    const randomTime = new Date(twoDaysAgo.getTime() + Math.random() * (now.getTime() - twoDaysAgo.getTime()));
    
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
      case "Toll Payment Verification":
        oldValue = Math.floor(60 + Math.random() * 30);
        newValue = Math.min(100, oldValue + 1);
        details = "Automated toll payment processed correctly";
        break;
      case "Traffic Signal Compliance":
        oldValue = Math.floor(70 + Math.random() * 20);
        newValue = Math.min(100, oldValue + 2);
        details = "Vehicle consistently respects traffic signals";
        break;
      case "Speed Limit Compliance":
        oldValue = Math.floor(65 + Math.random() * 25);
        newValue = Math.min(100, oldValue + 1);
        details = "Speed within limits in school and hospital zones";
        break;
      case "Lane Discipline Reward":
        oldValue = Math.floor(60 + Math.random() * 30);
        newValue = Math.min(100, oldValue + 1);
        details = "Proper lane usage and signaling observed";
        break;
      case "Junction Cooperation":
        oldValue = Math.floor(65 + Math.random() * 25);
        newValue = Math.min(100, oldValue + 1);
        details = "Cooperative behavior at congested junction";
        break;
      case "Incident Reporting":
        oldValue = Math.floor(70 + Math.random() * 20);
        newValue = Math.min(100, oldValue + 2);
        details = "Driver reported road hazard through connected system";
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
  // Expanded list of traffic zones in Hyderabad
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
  
  // Add more zones to reach desired count
  for (let i = 0; i < Math.max(0, count - congestionZones.length); i++) {
    // Base around Hyderabad city center
    const centerLat = 17.3850;
    const centerLng = 78.4867;
    
    // Random offset but keep within reasonable city limits
    const latOffset = (Math.random() * 0.3) - 0.15;
    const lngOffset = (Math.random() * 0.3) - 0.15;
    
    congestionZones.push({
      name: `Traffic Zone ${i + 21}`,
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset
    });
  }
  
  const congestion = [];
  const now = new Date();
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  // Generate multiple entries for each zone over time
  for (const zone of congestionZones.slice(0, count)) {
    // Create entries at 5-minute intervals over the last 48 hours
    const intervalMinutes = 5;
    let currentTime = new Date(twoDaysAgo);
    
    while (currentTime <= now) {
      // Current time in hours
      const currentHour = currentTime.getHours();
      
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
      
      // Using congestion_level (the actual field name in our database) instead of level
      const entry = {
        zone_name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        congestion_level: baseCongestionLevel,
        updated_at: currentTime.toISOString()
      };
      congestion.push(entry);
      
      // Increment time by interval
      currentTime = new Date(currentTime.getTime() + (intervalMinutes * 60000));
    }
  }
  
  return congestion;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Seed data function invoked");
    // Get request parameters
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // If JSON parsing fails, use an empty object
      console.error("Failed to parse request body", e);
    }
    
    const clearExisting = body.clear === true;
    const vehicleCount = parseInt(body.vehicles) || 10000;
    const rsuCount = parseInt(body.rsus) || 200;
    const anomalyCount = parseInt(body.anomalies) || 1000;
    const trustCount = parseInt(body.trustEntries) || 1000;
    const congestionCount = parseInt(body.congestionEntries) || 500;
    
    console.log(`Processing high-volume seed request: Clear existing=${clearExisting}, Vehicles=${vehicleCount}, RSUs=${rsuCount}, Anomalies=${anomalyCount}, Trust=${trustCount}, Congestion=${congestionCount}`);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
    }
    
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
    
    // Insert in batches to avoid timeouts
    const BATCH_SIZE = 500;
    const vehicleBatches = [];
    
    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
      const batch = vehicles.slice(i, i + BATCH_SIZE);
      vehicleBatches.push(batch);
    }
    
    console.log(`Splitting vehicles into ${vehicleBatches.length} batches...`);
    
    for (let i = 0; i < vehicleBatches.length; i++) {
      console.log(`Inserting vehicle batch ${i+1}/${vehicleBatches.length}...`);
      const { error } = await supabase.from('vehicles').insert(vehicleBatches[i]);
      if (error) {
        console.error(`Error inserting vehicle batch ${i+1}:`, error);
        throw new Error(`Error inserting vehicles: ${error.message}`);
      }
    }
    
    console.log(`Successfully inserted ${vehicles.length} vehicles`);
    
    // Generate RSUs
    console.log(`Generating ${rsuCount} RSUs...`);
    const rsus = generateMockRSUs(rsuCount);
    
    // Insert RSUs in batches if needed
    const rsuBatches = [];
    for (let i = 0; i < rsus.length; i += BATCH_SIZE) {
      rsuBatches.push(rsus.slice(i, i + BATCH_SIZE));
    }
    
    for (let i = 0; i < rsuBatches.length; i++) {
      const { error } = await supabase.from('rsus').insert(rsuBatches[i]);
      if (error) {
        console.error(`Error inserting RSU batch ${i+1}:`, error);
        throw new Error(`Error inserting RSUs: ${error.message}`);
      }
    }
    
    console.log(`Successfully inserted ${rsus.length} RSUs`);
    
    // Extract vehicle IDs for reference
    const vehicleIds = vehicles.map(v => v.vehicle_id);
    
    // Generate anomalies
    console.log(`Generating ${anomalyCount} anomalies...`);
    const anomalies = generateMockAnomalies(anomalyCount, vehicleIds);
    
    // Insert anomalies in batches to avoid timeout
    for (let i = 0; i < anomalies.length; i += BATCH_SIZE) {
      const batch = anomalies.slice(i, i + BATCH_SIZE);
      const { error: anomaliesError } = await supabase.from('anomalies').insert(batch);
      if (anomaliesError) {
        console.error(`Error inserting anomalies batch ${i/BATCH_SIZE + 1}:`, anomaliesError);
        throw new Error(`Error inserting anomalies: ${anomaliesError.message}`);
      }
      console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1} of anomalies (${batch.length} records)`);
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
      console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1} of trust ledger entries (${batch.length} records)`);
    }
    
    // Generate congestion data
    console.log(`Generating ${congestionCount} congestion zones with historical data...`);
    const congestionEntries = generateMockCongestion(congestionCount);
    
    // Insert congestion data in batches
    for (let i = 0; i < congestionEntries.length; i += BATCH_SIZE) {
      const batch = congestionEntries.slice(i, i + BATCH_SIZE);
      const { error: congestionError } = await supabase.from('zones_congestion').insert(batch);
      if (congestionError) {
        console.error(`Error inserting congestion batch ${i/BATCH_SIZE + 1}:`, congestionError);
        throw new Error(`Error inserting congestion data: ${congestionError.message}`);
      }
      console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1} of congestion entries (${batch.length} records)`);
    }
    
    console.log(`Successfully inserted ${congestionEntries.length} congestion entries`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "High-volume database seeded successfully",
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
