
import { fetchData } from "./config";
import { fetchFromSupabase } from "./supabase";
import { CongestionZone } from "./types";
import { ApiEndpoint } from "./config";

export async function fetchCongestionData(options = {}): Promise<CongestionZone[]> {
  try {
    // First try to fetch from Supabase
    const data = await fetchFromSupabase("congestion" as ApiEndpoint, options);
    console.log("Congestion data from Supabase:", data);
    return data;
  } catch (error) {
    console.error("Error fetching congestion data from Supabase:", error);
    // Fallback to direct API or mock data
    try {
      const apiData = await fetchData("congestion" as ApiEndpoint, options);
      return apiData;
    } catch (apiError) {
      console.error("Error fetching congestion data from API:", apiError);
      return getMockCongestion();
    }
  }
}

// More realistic mock data for congestion zones in Hyderabad
export const getMockCongestion = (): CongestionZone[] => [
  { id: 1, zone_name: "Hitech City Junction", lat: 17.4435, lng: 78.3772, congestion_level: 83, updated_at: "2025-04-28T10:15:00Z" },
  { id: 2, zone_name: "Gachibowli Flyover", lat: 17.4401, lng: 78.3489, congestion_level: 76, updated_at: "2025-04-28T10:15:00Z" },
  { id: 3, zone_name: "Banjara Hills Road No. 12", lat: 17.4156, lng: 78.4347, congestion_level: 65, updated_at: "2025-04-28T10:15:00Z" },
  { id: 4, zone_name: "Secunderabad Clock Tower", lat: 17.4399, lng: 78.4983, congestion_level: 72, updated_at: "2025-04-28T10:15:00Z" },
  { id: 5, zone_name: "Paradise Circle", lat: 17.4417, lng: 78.4992, congestion_level: 91, updated_at: "2025-04-28T10:15:00Z" },
  { id: 6, zone_name: "Madhapur Main Road", lat: 17.4478, lng: 78.3908, congestion_level: 87, updated_at: "2025-04-28T10:15:00Z" },
  { id: 7, zone_name: "Jubilee Hills Check Post", lat: 17.4273, lng: 78.4099, congestion_level: 79, updated_at: "2025-04-28T10:15:00Z" },
  { id: 8, zone_name: "Punjagutta Circle", lat: 17.4236, lng: 78.4475, congestion_level: 88, updated_at: "2025-04-28T10:15:00Z" },
  { id: 9, zone_name: "Mehdipatnam Bus Terminal", lat: 17.3938, lng: 78.4350, congestion_level: 93, updated_at: "2025-04-28T10:15:00Z" },
  { id: 10, zone_name: "Charminar Pedestrian Zone", lat: 17.3616, lng: 78.4747, congestion_level: 75, updated_at: "2025-04-28T10:15:00Z" },
  { id: 11, zone_name: "Kukatpally Y Junction", lat: 17.4938, lng: 78.3999, congestion_level: 81, updated_at: "2025-04-28T10:15:00Z" },
  { id: 12, zone_name: "LB Nagar Circle", lat: 17.3495, lng: 78.5475, congestion_level: 77, updated_at: "2025-04-28T10:15:00Z" }
];
