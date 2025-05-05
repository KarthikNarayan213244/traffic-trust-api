
import { ENDPOINTS } from '../config';

export type ApiEndpoint = keyof typeof ENDPOINTS;

// Define the mapping between endpoint names and their Supabase table names
export interface SupabaseTableMap {
  vehicles: string;
  rsus: string;
  anomalies: string;
  trustLedger: string;
  congestion: string;
  [key: string]: string;
}

// Define the types that each endpoint returns
export interface EndpointTypeMap {
  vehicles: any[];
  rsus: any[];
  anomalies: any[];
  trustLedger: any[];
  congestion: any[];
  [key: string]: any[];
}

// Options for fetching data
export interface FetchOptions {
  limit?: number;
  page?: number;
  filters?: Record<string, any>;
  orderBy?: {
    field: string;
    ascending?: boolean;
  };
}

// Configuration for seeding the database
export interface SeedOptions {
  vehicles?: number;
  rsus?: number;
  anomalies?: number;
  trustEntries?: number;
  congestionEntries?: number;
  overwrite?: boolean;
}

// Result of seeding operation
export interface SeedResult {
  success: boolean;
  counts: {
    vehicles: number;
    rsus: number;
    anomalies: number;
    trustEntries: number;
    congestionEntries: number;
  };
  errors?: any[];
}
