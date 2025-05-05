import { supabase } from "./client";
import { ENDPOINTS } from "../config";
import { EndpointTypeMap, endpointToTableMap, ValidTableName, 
  isVehicleData, isRsuData, isAnomalyData, isTrustLedgerData, isCongestionData } from "./types";
import { ApiEndpoint } from "./types";

// Fetch data from Supabase with proper type handling
export async function fetchFromSupabase<T extends ApiEndpoint>(endpoint: T, options: Record<string, any> = {}): Promise<EndpointTypeMap[T]> {
  // Get the corresponding table name for this endpoint
  const tableName = endpointToTableMap[endpoint] as ValidTableName;
  
  if (!tableName) {
    throw new Error(`Unknown endpoint: ${endpoint}`);
  }
  
  let query = supabase.from(tableName).select("*");
  
  // Apply query customizations based on endpoint
  switch (endpoint) {
    case "anomalies":
      query = query.order('timestamp', { ascending: false });
      break;
    case "trustLedger":
      query = query.order('timestamp', { ascending: false });
      break;
    case "congestion":
      // No special handling needed for basic select
      break;
    default:
      // No special handling needed for other endpoints
      break;
  }

  // Apply limit if specified in options
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  try {
    const result = await query;
    
    if (result.error) {
      console.error(`Supabase error for ${endpoint}:`, result.error);
      throw result.error;
    }
    
    console.log(`Successfully fetched ${result.data?.length || 0} records from ${tableName}`);
    
    // Transform data to match the expected types based on the endpoint
    if (!result.data || result.data.length === 0) {
      return [] as EndpointTypeMap[T];
    }
    
    // Type-safe transformation of data based on the endpoint
    switch (endpoint) {
      case "vehicles":
        return result.data.map(item => {
          if (!isVehicleData(item)) {
            console.error('Invalid vehicle data:', item);
            return null;
          }
          return {
            vehicle_id: item.vehicle_id,
            owner_name: item.owner_name,
            vehicle_type: item.vehicle_type,
            trust_score: item.trust_score,
            lat: item.lat,
            lng: item.lng,
            speed: item.speed,
            heading: item.heading,
            timestamp: item.timestamp,
            location: item.location,
            status: item.status
          };
        }).filter(Boolean) as EndpointTypeMap[T];
        
      case "rsus":
        return result.data.map(item => {
          if (!isRsuData(item)) {
            console.error('Invalid RSU data:', item);
            return null;
          }
          return {
            rsu_id: item.rsu_id,
            location: item.location,
            status: item.status,
            coverage_radius: item.coverage_radius,
            lat: item.lat,
            lng: item.lng
          };
        }).filter(Boolean) as EndpointTypeMap[T];
        
      case "anomalies":
        return result.data.map(item => {
          if (!isAnomalyData(item)) {
            console.error('Invalid anomaly data:', item);
            return null;
          }
          return {
            id: item.id,
            timestamp: item.timestamp,
            type: item.type,
            severity: item.severity,
            vehicle_id: item.vehicle_id,
            message: item.message || '',
            status: item.status
          };
        }).filter(Boolean) as EndpointTypeMap[T];
        
      case "trustLedger":
        return result.data.map(item => {
          if (!isTrustLedgerData(item)) {
            console.error('Invalid trust ledger data:', item);
            return null;
          }
          return {
            tx_id: item.tx_id,
            timestamp: item.timestamp,
            vehicle_id: item.vehicle_id,
            action: item.action,
            old_value: item.old_value,
            new_value: item.new_value,
            details: item.details
          };
        }).filter(Boolean) as EndpointTypeMap[T];
        
      case "congestion":
        return result.data.map(item => {
          if (!isCongestionData(item)) {
            console.error('Invalid congestion data:', item);
            return null;
          }
          return {
            id: Number(item.id) || 0,
            zone_name: item.zone_name,
            lat: item.lat,
            lng: item.lng,
            congestion_level: item.congestion_level,
            updated_at: item.updated_at
          };
        }).filter(Boolean) as EndpointTypeMap[T];
        
      default:
        // For safety, fallback to direct return but this should never happen
        console.warn(`No specific transformation for endpoint ${endpoint}, returning raw data`);
        return result.data as EndpointTypeMap[T];
    }
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    throw error;
  }
}
