
import { Vehicle, RSU, CongestionZone, Anomaly } from '@/services/api/types';

// Configuration types
export interface TrafficScalerConfig {
  VEHICLE_TARGET: number;
  RSU_DENSITY_KM: number;
  MIN_RSU_DISTANCE_KM: number;
  CACHE_TIMEOUT: number;
  VEHICLE_TYPES: Record<string, number>;
  OWNER_NAMES: string[];
  TRUST_SCORE_RANGES: Record<string, { min: number; max: number }>;
}

// Internal representation of traffic data
export interface RoadSegment {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  length: number; // in km
  congestion: number; // 0-100
  freeFlowSpeed: number;
  currentSpeed: number;
  vehicleCount: number;
}

export interface TrafficData {
  segments: RoadSegment[];
  totalLength: number;
  totalVehicles: number;
}

export interface TrafficStats {
  totalVehicles: number;
  totalRSUs: number;
  clusters: number;
  segments: number;
  lastUpdated: Date;
}

export interface VehicleCluster {
  count: number;
  avgLat: number;
  avgLng: number;
  vehicles: Vehicle[];
}

export type RSULocation = {
  lat: number;
  lng: number;
};
