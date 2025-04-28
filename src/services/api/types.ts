
// Type definitions for the data models
export type Vehicle = {
  vehicle_id: string;
  owner_name: string;
  vehicle_type: string;
  trust_score: number;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  timestamp?: string;
  location?: string;
  status?: string;
};

export type Rsu = {
  rsu_id: string;
  location: string;
  status: string;
  coverage_radius: number;
  lat: number;
  lng: number;
};

export type Anomaly = {
  id: number | string;
  timestamp: string;
  type: string;
  severity: string;
  vehicle_id: string;
  message: string;
  status?: string;
};

export type TrustLedgerEntry = {
  tx_id: string;
  timestamp: string;
  vehicle_id: string;
  action: string;
  old_value: number;
  new_value: number;
  details?: string;
};

export type CongestionZone = {
  id: number;
  zone_name: string;
  lat: number;
  lng: number;
  congestion_level: number;
  updated_at: string;
};
