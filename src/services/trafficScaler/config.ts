
import { TrafficScalerConfig } from './types';

// Configuration with defaults that can be overridden by environment variables
export const CONFIG: TrafficScalerConfig = {
  // Target number of vehicles to generate across Hyderabad
  VEHICLE_TARGET: parseInt(import.meta.env.VITE_HYD_VEHICLE_TARGET || '3500000', 10),
  
  // RSU density (one RSU per X kilometers of major road)
  RSU_DENSITY_KM: parseFloat(import.meta.env.VITE_HYD_RSU_DENSITY || '2.5'),
  
  // Minimum distance between RSUs in kilometers
  MIN_RSU_DISTANCE_KM: parseFloat(import.meta.env.VITE_MIN_RSU_DISTANCE || '0.5'),
  
  // Cache timeout in milliseconds (60 seconds)
  CACHE_TIMEOUT: 60000,
  
  // Vehicle types distribution (percentages)
  VEHICLE_TYPES: {
    car: 65,
    two_wheeler: 25,
    truck: 5,
    bus: 3,
    ambulance: 1,
    other: 1
  },
  
  // Sample owner names for generated vehicles
  OWNER_NAMES: [
    "Raj Kumar", "Priya Singh", "Amit Patel", "Deepa Sharma", "Mohammed Khan", 
    "Sunita Reddy", "Venkat Rao", "Lakshmi Devi", "Arjun Nair", "Fatima Begum",
    "Rajesh Khanna", "Ananya Das", "Surya Prakash", "Kavita Joshi", "Imran Ahmed"
  ],
  
  // Trust score ranges by vehicle types
  TRUST_SCORE_RANGES: {
    car: { min: 60, max: 95 },
    two_wheeler: { min: 50, max: 90 },
    truck: { min: 55, max: 85 },
    bus: { min: 65, max: 90 },
    ambulance: { min: 75, max: 99 },
    other: { min: 40, max: 85 }
  }
};
