
import { Vehicle, RSU, CongestionZone, Anomaly } from "@/services/api/types";

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

export interface TrafficData {
  vehicles: Vehicle[];
  rsus: RSU[];
  congestion: CongestionZone[];
  anomalies: Anomaly[];
}

export interface UseScaledTrafficDataProps {
  initialRefreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
  visibleBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevel?: number;
}

export interface UseScaledTrafficDataReturn {
  data: TrafficData;
  stats: TrafficStats;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date;
  refreshInterval: number;
  autoRefresh: boolean;
  refreshData: () => void;
  changeRefreshInterval: (newInterval: number) => void;
  toggleAutoRefresh: () => void;
  counts: TrafficCounts;
}
