
// API configuration and helper functions
const API_CONFIG = {
  baseUrl: "http://localhost:5000",
  endpoints: {
    vehicles: "/api/vehicles",
    rsus: "/api/rsus",
    anomalies: "/api/anomalies",
    trustLedger: "/api/trust/live_ledger"
  }
};

export async function fetchData(endpoint: keyof typeof API_CONFIG.endpoints) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    return [];
  }
}

// Mock data functions for development
export const getMockVehicles = () => [
  { vehicle_id: "V001", owner_name: "John Doe", vehicle_type: "Sedan", trust_score: 95 },
  { vehicle_id: "V002", owner_name: "Jane Smith", vehicle_type: "SUV", trust_score: 88 },
  { vehicle_id: "V003", owner_name: "Alex Johnson", vehicle_type: "Truck", trust_score: 92 },
  { vehicle_id: "V004", owner_name: "Maria Garcia", vehicle_type: "Compact", trust_score: 97 },
  { vehicle_id: "V005", owner_name: "Robert Chen", vehicle_type: "Sedan", trust_score: 75 }
];

export const getMockRSUs = () => [
  { rsu_id: "RSU001", location: "Main Street", status: "Active", coverage_radius: 500 },
  { rsu_id: "RSU002", location: "Highway 101", status: "Active", coverage_radius: 800 },
  { rsu_id: "RSU003", location: "Downtown", status: "Inactive", coverage_radius: 600 },
  { rsu_id: "RSU004", location: "Industrial Zone", status: "Active", coverage_radius: 700 }
];

export const getMockAnomalies = () => [
  { id: 1, timestamp: "2025-04-28T10:05:00Z", type: "Speed Violation", severity: "High", vehicle_id: "V002" },
  { id: 2, timestamp: "2025-04-28T09:15:00Z", type: "Signal Tampering", severity: "Critical", vehicle_id: "V005" },
  { id: 3, timestamp: "2025-04-28T08:30:00Z", type: "Unauthorized Access", severity: "Medium", vehicle_id: "V001" },
  { id: 4, timestamp: "2025-04-27T22:45:00Z", type: "GPS Spoofing", severity: "High", vehicle_id: "V003" }
];

export const getMockTrustLedger = () => [
  { tx_id: "TX123456", timestamp: "2025-04-28T10:30:00Z", vehicle_id: "V001", action: "Trust Score Update", old_value: 90, new_value: 95 },
  { tx_id: "TX123457", timestamp: "2025-04-28T09:45:00Z", vehicle_id: "V002", action: "Trust Score Update", old_value: 95, new_value: 88 },
  { tx_id: "TX123458", timestamp: "2025-04-28T08:15:00Z", vehicle_id: "V005", action: "Trust Score Update", old_value: 85, new_value: 75 },
  { tx_id: "TX123459", timestamp: "2025-04-28T07:30:00Z", vehicle_id: "V003", action: "Trust Score Update", old_value: 89, new_value: 92 }
];

export const getMockData = (endpoint: string) => {
  switch (endpoint) {
    case "vehicles":
      return getMockVehicles();
    case "rsus":
      return getMockRSUs();
    case "anomalies":
      return getMockAnomalies();
    case "trustLedger":
      return getMockTrustLedger();
    default:
      return [];
  }
};
