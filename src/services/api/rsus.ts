
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { RSU } from "./types";
import { fetchRealTimeTrafficData } from "./external";
import { isRealTimeDataAvailable } from "./external";

export async function fetchRSUs(options = {}): Promise<RSU[]> {
  try {
    // Always try to use real-time traffic API first
    if (isRealTimeDataAvailable()) {
      try {
        console.log("Attempting to fetch RSUs from real-time traffic API...");
        const realTimeData = await fetchRealTimeTrafficData();
        
        if (realTimeData.rsus && realTimeData.rsus.length > 0) {
          console.log(`Successfully fetched ${realTimeData.rsus.length} RSUs from real-time API`);
          return realTimeData.rsus;
        } else {
          console.log("Real-time API returned no RSUs, falling back to other sources");
        }
      } catch (realTimeError) {
        console.error("Error fetching RSUs from real-time API:", realTimeError);
        // Continue to try other data sources
      }
    } else {
      console.log("Real-time data sources not available, falling back to database");
    }
    
    // Then try to fetch from Supabase
    try {
      console.log("Attempting to fetch RSUs from Supabase...");
      const data = await fetchFromSupabase<"rsus">("rsus", { limit: 1000 }); // Increased limit
      if (data.length > 0) {
        console.log(`Successfully fetched ${data.length} RSUs from Supabase`);
        return data;
      }
    } catch (error) {
      console.error("Error fetching RSUs from Supabase:", error);
      // Fallback to direct API or mock data
    }

    // Fallback to direct API
    try {
      console.log("Attempting to fetch RSUs from direct API...");
      const apiData = await fetchData("rsus", { limit: 1000 }); // Increased limit
      if (apiData.length > 0) {
        console.log(`Successfully fetched ${apiData.length} RSUs from direct API`);
        return apiData;
      }
    } catch (apiError) {
      console.error("Error fetching RSUs from API:", apiError);
      // Final fallback to mock data
    }
    
    console.log("All data sources failed, using mock data");
    return getMockRSUs(40); // Generate more mock RSUs
  } catch (error) {
    console.error("All RSU data sources failed:", error);
    return getMockRSUs(40); // Generate more mock RSUs as fallback
  }
}

// Mock data for RSUs - now generates a specified number of units
export function getMockRSUs(count = 40): RSU[] {
  console.log(`Generating ${count} mock RSUs for Hyderabad area`);
  
  // Key locations in Hyderabad for placing RSUs
  const hyderabadLocations = [
    { name: "Hitech City", lat: 17.4435, lng: 78.3772 },
    { name: "Charminar", lat: 17.3616, lng: 78.4747 },
    { name: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
    { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
    { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
    { name: "Madhapur", lat: 17.4482, lng: 78.3915 },
    { name: "Jubilee Hills", lat: 17.4310, lng: 78.4069 },
    { name: "Kukatpally", lat: 17.4934, lng: 78.4135 },
    { name: "Begumpet", lat: 17.4424, lng: 78.4673 },
    { name: "Shamshabad", lat: 17.2403, lng: 78.4294 }
  ];
  
  const rsus: RSU[] = [];
  
  for (let i = 0; i < count; i++) {
    // Choose a base location and add some random offset
    const baseLocation = hyderabadLocations[i % hyderabadLocations.length];
    const randomLat = baseLocation.lat + (Math.random() * 0.05 - 0.025); // Small variance
    const randomLng = baseLocation.lng + (Math.random() * 0.05 - 0.025);
    
    // Generate RSU ID with sequence number
    const rsuId = `RSU-${(i + 1).toString().padStart(3, '0')}`;
    
    // Randomize coverage radius between 350-650 meters
    const coverageRadius = Math.floor(350 + Math.random() * 300);
    
    // 90% active, 10% inactive
    const status = Math.random() > 0.1 ? 'Active' : 'Inactive';
    
    rsus.push({ 
      rsu_id: rsuId, 
      location: {
        lat: randomLat,
        lng: randomLng
      }, 
      lat: randomLat, 
      lng: randomLng, 
      status: status,
      coverage_radius: coverageRadius
    });
  }
  
  return rsus;
}
