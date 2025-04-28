
import { ApiEndpoint } from "../config";
import { Vehicle, Rsu, Anomaly, TrustLedgerEntry, CongestionZone } from "../types";

// Type mapping for each endpoint's return type
export type EndpointTypeMap = {
  vehicles: Vehicle[];
  rsus: Rsu[];
  anomalies: Anomaly[];
  trustLedger: TrustLedgerEntry[];
  congestion: CongestionZone[];
};

// Map API endpoints to their corresponding Supabase table names
export const endpointToTableMap = {
  vehicles: "vehicles",
  rsus: "rsus",
  anomalies: "anomalies",
  trustLedger: "trust_ledger",
  congestion: "zones_congestion"
} as const;

// Define a type for valid table names based on the values in our map
export type ValidTableName = typeof endpointToTableMap[keyof typeof endpointToTableMap];

// Type guards for each data type
export function isVehicleData(item: any): item is Vehicle {
  return item && 'vehicle_id' in item && 'owner_name' in item && 'vehicle_type' in item;
}

export function isRsuData(item: any): item is Rsu {
  return item && 'rsu_id' in item && 'location' in item && 'coverage_radius' in item;
}

export function isAnomalyData(item: any): item is Anomaly {
  return item && 'type' in item && 'severity' in item && 'vehicle_id' in item;
}

export function isTrustLedgerData(item: any): item is TrustLedgerEntry {
  return item && 'tx_id' in item && 'action' in item && 'old_value' in item && 'new_value' in item;
}

export function isCongestionData(item: any): item is CongestionZone {
  return item && 'zone_name' in item && 'congestion_level' in item;
}
