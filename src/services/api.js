import axios from 'axios';

// Create an axios instance with base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API functions
export const fetchVehicles = async () => {
  try {
    const response = await apiClient.get('/api/vehicles');
    return response.data;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

export const fetchRSUs = async () => {
  try {
    const response = await apiClient.get('/api/rsus');
    return response.data;
  } catch (error) {
    console.error('Error fetching RSUs:', error);
    throw error;
  }
};

export const fetchAnomalies = async () => {
  try {
    const response = await apiClient.get('/api/anomalies');
    return response.data;
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    throw error;
  }
};

export const fetchTrustLedger = async () => {
  try {
    const response = await apiClient.get('/api/trust/live_ledger');
    return response.data;
  } catch (error) {
    console.error('Error fetching trust ledger:', error);
    throw error;
  }
};

// Fallback to mock data when API is unreachable
export const getMockData = (endpoint) => {
  switch (endpoint) {
    case 'vehicles':
      return getMockVehicles();
    case 'rsus':
      return getMockRSUs();
    case 'anomalies':
      return getMockAnomalies();
    case 'trustLedger':
      return getMockTrustLedger();
    case 'congestion':
      return getMockCongestion();
    default:
      return [];
  }
};

// Mock data functions (keeping the same mock data from the existing api.ts)
export const getMockVehicles = () => [
  { vehicle_id: "HYD001", owner_name: "Raj Kumar", vehicle_type: "Sedan", trust_score: 95 },
  { vehicle_id: "HYD002", owner_name: "Priya Sharma", vehicle_type: "SUV", trust_score: 88 },
  { vehicle_id: "HYD003", owner_name: "Amit Patel", vehicle_type: "Truck", trust_score: 92 },
  { vehicle_id: "HYD004", owner_name: "Deepa Reddy", vehicle_type: "Compact", trust_score: 97 },
  { vehicle_id: "HYD005", owner_name: "Vikram Singh", vehicle_type: "Sedan", trust_score: 75 }
];

export const getMockRSUs = () => [
  { rsu_id: "RSU001", location: "Hitech City", status: "Active", coverage_radius: 500 },
  { rsu_id: "RSU002", location: "Gachibowli", status: "Active", coverage_radius: 800 },
  { rsu_id: "RSU003", location: "Banjara Hills", status: "Inactive", coverage_radius: 600 },
  { rsu_id: "RSU004", location: "Secunderabad", status: "Active", coverage_radius: 700 }
];

export const getMockAnomalies = () => [
  { id: 1, timestamp: "2025-04-28T10:05:00Z", type: "Speed Violation", severity: "High", vehicle_id: "HYD002" },
  { id: 2, timestamp: "2025-04-28T09:15:00Z", type: "Signal Tampering", severity: "Critical", vehicle_id: "HYD005" },
  { id: 3, timestamp: "2025-04-28T08:30:00Z", type: "Unauthorized Access", severity: "Medium", vehicle_id: "HYD001" },
  { id: 4, timestamp: "2025-04-27T22:45:00Z", type: "GPS Spoofing", severity: "High", vehicle_id: "HYD003" }
];

export const getMockTrustLedger = () => [
  { tx_id: "TX123456", timestamp: "2025-04-28T10:30:00Z", vehicle_id: "HYD001", action: "Trust Score Update", old_value: 90, new_value: 95 },
  { tx_id: "TX123457", timestamp: "2025-04-28T09:45:00Z", vehicle_id: "HYD002", action: "Trust Score Update", old_value: 95, new_value: 88 },
  { tx_id: "TX123458", timestamp: "2025-04-28T08:15:00Z", vehicle_id: "HYD005", action: "Trust Score Update", old_value: 85, new_value: 75 },
  { tx_id: "TX123459", timestamp: "2025-04-28T07:30:00Z", vehicle_id: "HYD003", action: "Trust Score Update", old_value: 89, new_value: 92 }
];

export const getMockCongestion = () => [
  { id: 1, location: "Hitech City", level: 8, timestamp: "2025-04-28T10:15:00Z" },
  { id: 2, location: "Gachibowli", level: 5, timestamp: "2025-04-28T10:15:00Z" },
  { id: 3, location: "Banjara Hills", level: 3, timestamp: "2025-04-28T10:15:00Z" },
  { id: 4, location: "Secunderabad", level: 6, timestamp: "2025-04-28T10:15:00Z" }
];
