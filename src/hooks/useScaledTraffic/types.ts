
import { Vehicle, RSU, CongestionZone, Anomaly } from '@/services/api/types';

export interface TrafficData {
  vehicles: Vehicle[];
  rsus: RSU[];
  congestion: CongestionZone[];
  anomalies: Anomaly[];
}

export interface TrafficStats {
  totalVehicles: number;
  visibleVehicles: number;
  totalRSUs: number;
  visibleRSUs: number;
}

export interface TrafficCounts {
  vehicles: number;
  rsus: number;
  congestion: number;
  anomalies: number;
  totalVehicles: number;
  totalRSUs: number;
}
