export interface Vehicle {
  vehicle_id: string;
  owner_name: string;
  vehicle_type: string;
  location: {
    lat: number;
    lng: number;
  };
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  trust_score: number;
  trust_score_change?: number;
  trust_score_confidence?: number;
  status: string;
  timestamp: string;
}

export interface RSU {
  rsu_id: string;
  location: {
    lat: number;
    lng: number;
  };
  lat: number;
  lng: number;
  status: 'Active' | 'Inactive';
  coverage_radius: number;
  heading?: number;
  last_seen?: string; // Added this field to match what's being used in RsuMarkers.tsx
}

export interface Anomaly {
  id: string;
  timestamp: string;
  vehicle_id: string;
  type: string;
  severity: string;
  message: string;
  status: 'Detected' | 'Resolved' | 'Under Investigation' | 'False Alarm';
  ml_confidence: number;
  // Direct coordinates for mapping
  lat?: number;
  lng?: number;
  // Legacy location format (kept for backward compatibility)
  location?: {
    lat: number;
    lng: number;
  };
}

export interface TrustLedgerEntry {
  id: string;
  timestamp: string;
  vehicle_id: string;
  old_score: number;
  new_score: number;
  change: number;
  reason: string;
  tx_id?: string;
  action?: string;
  old_value?: number;
  new_value?: number;
  details?: string;
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
