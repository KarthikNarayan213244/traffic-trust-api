
import { Anomaly, CongestionZone, RSU, TrustLedgerEntry, Vehicle } from "../types";

export type SupabaseTable = 
  | "vehicles" 
  | "rsus" 
  | "anomalies" 
  | "trust" 
  | "congestion";

export type TableDataTypes = {
  vehicles: Vehicle;
  rsus: RSU;
  anomalies: Anomaly;
  trust: TrustLedgerEntry;
  congestion: CongestionZone;
};

export type DataTypeMap<T extends SupabaseTable> = TableDataTypes[T];
