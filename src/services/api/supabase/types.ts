
import { Anomaly, CongestionZone, RSU, TrustLedgerEntry, Vehicle } from "../types";
import { ApiEndpoint } from "../config";

export type SupabaseTable = 
  | "vehicles" 
  | "rsus" 
  | "anomalies" 
  | "trust_ledger"
  | "zones_congestion";

export type ValidTableName = SupabaseTable;

export type TableDataTypes = {
  vehicles: Vehicle;
  rsus: RSU;
  anomalies: Anomaly;
  trust_ledger: TrustLedgerEntry;
  zones_congestion: CongestionZone;
};

export type DataTypeMap<T extends SupabaseTable> = TableDataTypes[T];

// Define the mapping between API endpoints and Supabase tables
export const endpointToTableMap: Record<ApiEndpoint, SupabaseTable> = {
  vehicles: "vehicles",
  rsus: "rsus",
  anomalies: "anomalies",
  trustLedger: "trust_ledger",
  congestion: "zones_congestion"
};

// Type mappings for API endpoints to their return types
export type EndpointTypeMap = {
  vehicles: Vehicle[];
  rsus: RSU[];
  anomalies: Anomaly[];
  trustLedger: TrustLedgerEntry[];
  congestion: CongestionZone[];
};

// Type guard functions to validate data types
export function isVehicleData(item: any): item is Vehicle {
  return (
    item &&
    typeof item.vehicle_id === 'string' &&
    typeof item.owner_name === 'string' &&
    typeof item.vehicle_type === 'string'
  );
}

export function isRsuData(item: any): item is RSU {
  return (
    item &&
    typeof item.rsu_id === 'string' &&
    typeof item.status === 'string' &&
    typeof item.coverage_radius === 'number'
  );
}

export function isAnomalyData(item: any): item is Anomaly {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.timestamp === 'string' &&
    typeof item.type === 'string' &&
    typeof item.severity === 'string'
  );
}

export function isTrustLedgerData(item: any): item is TrustLedgerEntry {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.timestamp === 'string' &&
    typeof item.vehicle_id === 'string' &&
    (typeof item.old_score === 'number' || typeof item.old_value === 'number')
  );
}

export function isCongestionData(item: any): item is CongestionZone {
  return (
    item &&
    (typeof item.id === 'string' || typeof item.id === 'number') &&
    typeof item.zone_name === 'string' &&
    typeof item.lat === 'number' &&
    typeof item.lng === 'number' &&
    typeof item.congestion_level === 'number'
  );
}
