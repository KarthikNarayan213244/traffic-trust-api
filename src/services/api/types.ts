export interface Vehicle {
  vehicle_id: string;
  owner_name: string;
  vehicle_type: string;
  location: {
    lat: number;
    lng: number;
  };
  speed: number;
  heading: number;
  trust_score: number;
  trust_score_change: number;
  trust_score_confidence: number;
}

export interface RSU {
  rsu_id: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'Active' | 'Inactive';
  coverage_radius: number;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  vehicle_id: string;
  type: string;
  severity: string;
  message: string;
  status: 'Detected' | 'Resolved';
  ml_confidence: number;
}

export interface TrustLedgerEntry {
  id: string;
  timestamp: string;
  vehicle_id: string;
  old_score: number;
  new_score: number;
  change: number;
  reason: string;
}

export interface CongestionZone {
  id: string;
  zone_name: string;
  lat: number;
  lng: number;
  congestion_level: number;
  updated_at: string;
  predicted_by_ml?: boolean;
  ml_confidence?: number;
}
