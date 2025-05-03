
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { Vehicle } from "./types";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

export async function fetchVehicles(options = {}): Promise<Vehicle[]> {
  try {
    // Always try to use real-time traffic API first
    if (isRealTimeDataAvailable()) {
      try {
        console.log("Attempting to fetch vehicles from real-time traffic API...");
        const realTimeData = await fetchRealTimeTrafficData();
        
        if (realTimeData.vehicles && realTimeData.vehicles.length > 0) {
          console.log(`Successfully fetched ${realTimeData.vehicles.length} vehicles from real-time API`);
          return realTimeData.vehicles;
        } else {
          console.log("Real-time API returned no vehicle data, falling back to other sources");
        }
      } catch (realTimeError) {
        console.error("Error fetching vehicles from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    } else {
      console.log("Real-time data sources not available, falling back to database");
    }
    
    // Then try to fetch from Supabase
    try {
      console.log("Attempting to fetch vehicles from Supabase...");
      const data = await fetchFromSupabase<"vehicles">("vehicles", { limit: 5000 }); // Increased limit
      if (data.length > 0) {
        console.log(`Successfully fetched ${data.length} vehicles from Supabase`);
        return data;
      }
    } catch (error) {
      console.error("Error fetching vehicles from Supabase:", error);
    }

    // Fallback to direct API
    try {
      console.log("Attempting to fetch vehicles from direct API...");
      const apiData = await fetchData("vehicles", { limit: 5000 }); // Increased limit
      if (apiData.length > 0) {
        console.log(`Successfully fetched ${apiData.length} vehicles from direct API`);
        return apiData;
      }
    } catch (apiError) {
      console.error("Error fetching vehicles from API:", apiError);
    }
    
    console.log("All data sources failed, using mock data");
    return getMockVehicles(200); // Generate more mock vehicles
  } catch (error) {
    console.error("All vehicle data sources failed:", error);
    return getMockVehicles(200); // Generate more mock vehicles as fallback
  }
}

// Mock data function - now generates dynamic number of vehicles
export function getMockVehicles(count = 50): Vehicle[] {
  console.log(`Generating ${count} mock vehicles for Hyderabad area`);
  
  // Base location for Hyderabad
  const centerLat = 17.4;
  const centerLng = 78.38;
  const vehicles: Vehicle[] = [];

  // Vehicle types
  const vehicleTypes = ["Sedan", "SUV", "Hatchback", "Bus", "Truck", "Auto-rickshaw", "Taxi", "Two-wheeler"];
  
  // Indian names
  const firstNames = ["Rahul", "Priya", "Vikram", "Ananya", "Arun", "Divya", "Suresh", "Pooja", "Arjun", "Neha", 
                      "Raj", "Meera", "Amit", "Kavita", "Deepak", "Shweta", "Sanjay", "Anjali", "Vivek", "Nisha"];
  
  const lastNames = ["Sharma", "Patel", "Singh", "Reddy", "Kumar", "Rao", "Joshi", "Malhotra", "Iyer", "Gupta",
                     "Mehta", "Verma", "Kapoor", "Shah", "Das", "Nair", "Mishra", "Menon", "Pillai", "Banerjee"];

  for (let i = 0; i < count; i++) {
    // Generate random position within Hyderabad area
    const randomLat = centerLat + (Math.random() * 0.3 - 0.15);
    const randomLng = centerLng + (Math.random() * 0.3 - 0.15);
    
    // Generate vehicle ID with Telangana state code
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const randomAlpha = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                        String.fromCharCode(65 + Math.floor(Math.random() * 26));
    
    const vehicleId = `TS${Math.floor(Math.random() * 15 + 1).toString().padStart(2, '0')}-${randomNum}-${randomAlpha}`;
    
    // Generate random owner name
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Generate random trust score
    const trustScore = Math.floor(75 + Math.random() * 25);
    
    // Random heading (direction in degrees)
    const heading = Math.floor(Math.random() * 360);
    
    // Random speed
    const speed = Math.floor(10 + Math.random() * 80);
    
    vehicles.push({ 
      vehicle_id: vehicleId, 
      owner_name: `${firstName} ${lastName}`, 
      vehicle_type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)], 
      trust_score: trustScore, 
      location: { lat: randomLat, lng: randomLng },
      lat: randomLat, 
      lng: randomLng, 
      speed: speed,
      heading: heading,
      trust_score_change: Math.floor(Math.random() * 5) - 2,
      trust_score_confidence: trustScore / 100,
      status: "Active",
      timestamp: new Date().toISOString()
    });
  }
  
  return vehicles;
}
