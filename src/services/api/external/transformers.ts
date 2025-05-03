
import { v4 as uuidv4 } from 'uuid';
import { Vehicle, CongestionZone, Anomaly } from '../types';

/**
 * Transform functions for HERE Traffic API data
 */
export function transformHereVehicleData(apiData: any): Vehicle[] {
  try {
    const vehicles: Vehicle[] = [];
    
    // Extract flow items that represent vehicle positions
    if (apiData?.RWS?.[0]?.RW) {
      const roadways = apiData.RWS[0].RW;
      
      for (const road of roadways) {
        if (road.FIS) {
          for (const flowItem of road.FIS) {
            if (flowItem.FI && Array.isArray(flowItem.FI)) {
              for (const fi of flowItem.FI) {
                // Each FI may represent traffic flow at a specific point
                if (fi.TMC?.PC && fi.CF && Array.isArray(fi.CF)) {
                  const mainInfo = fi.CF[0]; // Current flow info
                  
                  // Extract only a subset of flow points to simulate vehicles
                  if (Math.random() > 0.7) { // Only use ~30% of flow points
                    const speedKmh = mainInfo.SU || 0; // Speed in km/h
                    const vehicle: Vehicle = {
                      vehicle_id: `H-${uuidv4().substring(0, 8)}`, // Generate a unique ID with HERE prefix
                      owner_name: "Traffic Flow Vehicle", // Simulated owner name
                      vehicle_type: determineVehicleType(), // Randomly determine vehicle type
                      lat: fi.TMC.PC.y, // Latitude
                      lng: fi.TMC.PC.x, // Longitude
                      location: {
                        lat: fi.TMC.PC.y,
                        lng: fi.TMC.PC.x
                      },
                      speed: speedKmh,
                      heading: fi.TMC?.QD || Math.floor(Math.random() * 360), // Quick direction or random
                      trust_score: Math.floor(70 + Math.random() * 30), // Random trust score between 70-100
                      trust_score_change: 0,
                      trust_score_confidence: 0.9,
                      status: "Active",
                      timestamp: new Date().toISOString()
                    };
                    vehicles.push(vehicle);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return vehicles;
  } catch (error) {
    console.error("Error transforming HERE vehicle data:", error);
    return [];
  }
}

export function transformHereCongestionData(apiData: any): CongestionZone[] {
  try {
    const congestionZones: CongestionZone[] = [];
    
    // Extract congestion information from flow data
    if (apiData?.RWS?.[0]?.RW) {
      const roadways = apiData.RWS[0].RW;
      
      for (const road of roadways) {
        // Process each road segment
        if (road.FIS) {
          for (const flowItem of road.FIS) {
            if (flowItem.FI && Array.isArray(flowItem.FI)) {
              for (const fi of flowItem.FI) {
                // Each FI represent a road segment with congestion info
                if (fi.TMC?.PC && fi.CF && Array.isArray(fi.CF)) {
                  const congestionInfo = fi.CF[0]; // Current flow info
                  
                  // Only create congestion zones for segments with notable congestion
                  if (congestionInfo.JF && congestionInfo.JF > 4) { // JF is jamFactor, higher means more congestion
                    const congestionZone: CongestionZone = {
                      id: `H-${uuidv4().substring(0, 8)}`,
                      zone_name: road.DE || `Road Segment ${fi.TMC.PC.x.toFixed(4)},${fi.TMC.PC.y.toFixed(4)}`,
                      lat: fi.TMC.PC.y, // Latitude
                      lng: fi.TMC.PC.x, // Longitude
                      congestion_level: Math.min(100, Math.round(congestionInfo.JF * 10)), // Convert jamFactor (0-10) to 0-100 scale
                      updated_at: new Date().toISOString(),
                      predicted_by_ml: false,
                      ml_confidence: 1
                    };
                    congestionZones.push(congestionZone);
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return congestionZones;
  } catch (error) {
    console.error("Error transforming HERE congestion data:", error);
    return [];
  }
}

export function transformHereAnomalyData(apiData: any): Anomaly[] {
  try {
    const anomalies: Anomaly[] = [];
    
    // Check if we have incidents data
    if (apiData?.TRAFFIC_ITEMS?.TRAFFIC_ITEM) {
      const incidents = apiData.TRAFFIC_ITEMS.TRAFFIC_ITEM;
      
      for (const incident of incidents) {
        // Map HERE incident type to our anomaly type
        const anomalyType = mapHereIncidentTypeToAnomalyType(incident.TRAFFIC_ITEM_TYPE_DESC);
        
        // Map HERE criticality to our severity levels
        const severity = mapHereCriticalityToSeverity(incident.CRITICALITY?.DESCRIPTION);
        
        // Get coordinates
        let lat = 0, lng = 0;
        if (incident.LOCATION?.GEOLOC?.ORIGIN?.LATITUDE && incident.LOCATION?.GEOLOC?.ORIGIN?.LONGITUDE) {
          lat = incident.LOCATION.GEOLOC.ORIGIN.LATITUDE;
          lng = incident.LOCATION.GEOLOC.ORIGIN.LONGITUDE;
        }
        
        // Create anomaly object
        if (lat !== 0 && lng !== 0) {
          const anomaly: Anomaly = {
            id: `H-${incident.TRAFFIC_ITEM_ID || uuidv4().substring(0, 8)}`,
            timestamp: new Date(incident.START_TIME || Date.now()).toISOString(),
            vehicle_id: `UNK-${uuidv4().substring(0, 8)}`, // Unknown vehicle ID for incidents
            type: anomalyType,
            severity: severity,
            message: incident.DESCRIPTION || incident.SHORT_DESC || "Traffic incident detected",
            status: incident.STATUS === "ACTIVE" ? "Detected" : "Resolved",
            ml_confidence: 1.0
          };
          
          anomalies.push(anomaly);
        }
      }
    }
    
    return anomalies;
  } catch (error) {
    console.error("Error transforming HERE anomaly data:", error);
    return [];
  }
}

/**
 * Transform functions for TomTom Traffic API data
 */
export function transformTomTomVehicleData(apiData: any): Vehicle[] {
  try {
    const vehicles: Vehicle[] = [];
    
    // Extract flow items that represent vehicle positions
    if (apiData?.flowSegmentData?.coordinates?.coordinate) {
      const coordinates = apiData.flowSegmentData.coordinates.coordinate;
      
      for (const coord of coordinates) {
        // Extract only a subset of flow points to simulate vehicles
        if (Math.random() > 0.7) { // Only use ~30% of flow points
          const speedKmh = apiData.flowSegmentData.currentSpeed || 0;
          const vehicle: Vehicle = {
            vehicle_id: `T-${uuidv4().substring(0, 8)}`, // Generate a unique ID with TomTom prefix
            owner_name: "Traffic Flow Vehicle", // Simulated owner name
            vehicle_type: determineVehicleType(), // Randomly determine vehicle type
            lat: coord.latitude, // Latitude
            lng: coord.longitude, // Longitude
            location: {
              lat: coord.latitude,
              lng: coord.longitude
            },
            speed: speedKmh,
            heading: Math.floor(Math.random() * 360), // Random heading
            trust_score: Math.floor(70 + Math.random() * 30), // Random trust score between 70-100
            trust_score_change: 0,
            trust_score_confidence: 0.9,
            status: "Active",
            timestamp: new Date().toISOString()
          };
          vehicles.push(vehicle);
        }
      }
    }
    
    return vehicles;
  } catch (error) {
    console.error("Error transforming TomTom vehicle data:", error);
    return [];
  }
}

export function transformTomTomCongestionData(apiData: any): CongestionZone[] {
  try {
    const congestionZones: CongestionZone[] = [];
    
    // Extract congestion information from flow data
    if (apiData?.flowSegmentData) {
      const flowData = apiData.flowSegmentData;
      
      // Calculate congestion level based on currentSpeed vs freeFlowSpeed
      const freeFlowSpeed = flowData.freeFlowSpeed || 0;
      const currentSpeed = flowData.currentSpeed || 0;
      
      if (freeFlowSpeed > 0 && currentSpeed < freeFlowSpeed) {
        const congestionRatio = 1 - (currentSpeed / freeFlowSpeed);
        const congestionLevel = Math.min(100, Math.round(congestionRatio * 100));
        
        // Only create congestion zones for segments with notable congestion
        if (congestionLevel > 20) { // At least 20% congestion
          // Use the coordinates to place the congestion zone
          if (flowData.coordinates?.coordinate && flowData.coordinates.coordinate.length > 0) {
            const midPoint = flowData.coordinates.coordinate[Math.floor(flowData.coordinates.coordinate.length / 2)];
            
            const congestionZone: CongestionZone = {
              id: `T-${uuidv4().substring(0, 8)}`,
              zone_name: flowData.roadName || `Road Segment ${midPoint.latitude.toFixed(4)},${midPoint.longitude.toFixed(4)}`,
              lat: midPoint.latitude,
              lng: midPoint.longitude,
              congestion_level: congestionLevel,
              updated_at: new Date().toISOString(),
              predicted_by_ml: false,
              ml_confidence: 1
            };
            congestionZones.push(congestionZone);
          }
        }
      }
    }
    
    return congestionZones;
  } catch (error) {
    console.error("Error transforming TomTom congestion data:", error);
    return [];
  }
}

export function transformTomTomAnomalyData(apiData: any): Anomaly[] {
  try {
    const anomalies: Anomaly[] = [];
    
    // Check if we have incidents data
    if (apiData?.incidents) {
      const incidents = apiData.incidents;
      
      for (const incident of incidents) {
        // Map TomTom incident type to our anomaly type
        const anomalyType = mapTomTomIncidentTypeToAnomalyType(incident.type);
        
        // Map TomTom magnitudeOfDelay to our severity levels
        const severity = mapTomTomMagnitudeToSeverity(incident.magnitudeOfDelay);
        
        // Get coordinates from the geometry
        let lat = 0, lng = 0;
        if (incident.geometry && incident.geometry.type === "Point" && incident.geometry.coordinates) {
          lng = incident.geometry.coordinates[0];
          lat = incident.geometry.coordinates[1];
        }
        
        // Create anomaly object
        if (lat !== 0 && lng !== 0) {
          const anomaly: Anomaly = {
            id: `T-${incident.id || uuidv4().substring(0, 8)}`,
            timestamp: new Date(incident.startTime || Date.now()).toISOString(),
            vehicle_id: `UNK-${uuidv4().substring(0, 8)}`, // Unknown vehicle ID for incidents
            type: anomalyType,
            severity: severity,
            message: incident.description || "Traffic incident detected",
            status: "Detected",
            ml_confidence: 1.0
          };
          
          anomalies.push(anomaly);
        }
      }
    }
    
    return anomalies;
  } catch (error) {
    console.error("Error transforming TomTom anomaly data:", error);
    return [];
  }
}

/**
 * Transform functions for OpenData/Government API data
 * These are more generic as open data APIs can vary in structure
 */
export function transformOpenDataVehicleData(apiData: any): Vehicle[] {
  try {
    const vehicles: Vehicle[] = [];
    
    // Try common structures in open data APIs
    let vehicleData: any[] = [];
    
    // Check for different possible data structures
    if (apiData?.vehicles && Array.isArray(apiData.vehicles)) {
      vehicleData = apiData.vehicles;
    } else if (apiData?.data?.vehicles && Array.isArray(apiData.data.vehicles)) {
      vehicleData = apiData.data.vehicles;
    } else if (apiData?.features && Array.isArray(apiData.features)) {
      // GeoJSON format
      vehicleData = apiData.features;
    } else if (Array.isArray(apiData)) {
      vehicleData = apiData;
    }
    
    // Process vehicle data
    for (const item of vehicleData) {
      let lat = 0, lng = 0;
      let vehicleId = '';
      let vehicleType = '';
      let speed = 0;
      let heading = 0;
      
      // Extract coordinates based on common formats
      if (item.geometry && item.geometry.type === 'Point' && Array.isArray(item.geometry.coordinates)) {
        // GeoJSON format
        lng = item.geometry.coordinates[0];
        lat = item.geometry.coordinates[1];
        
        // Properties often contain the attributes
        if (item.properties) {
          vehicleId = item.properties.id || item.properties.vehicle_id || '';
          vehicleType = item.properties.type || item.properties.vehicle_type || '';
          speed = item.properties.speed || 0;
          heading = item.properties.heading || item.properties.direction || 0;
        }
      } else if (item.lat !== undefined && item.lon !== undefined) {
        lat = item.lat;
        lng = item.lon;
        vehicleId = item.id || '';
        vehicleType = item.type || '';
        speed = item.speed || 0;
        heading = item.heading || item.direction || 0;
      } else if (item.latitude !== undefined && item.longitude !== undefined) {
        lat = item.latitude;
        lng = item.longitude;
        vehicleId = item.id || '';
        vehicleType = item.type || item.vehicleType || '';
        speed = item.speed || 0;
        heading = item.heading || item.direction || 0;
      } else if (item.coords && item.coords.latitude !== undefined && item.coords.longitude !== undefined) {
        lat = item.coords.latitude;
        lng = item.coords.longitude;
        vehicleId = item.id || '';
        vehicleType = item.type || '';
        speed = item.speed || 0;
        heading = item.heading || 0;
      }
      
      // Create vehicle if we have valid coordinates
      if (lat !== 0 && lng !== 0) {
        const vehicle: Vehicle = {
          vehicle_id: vehicleId || `O-${uuidv4().substring(0, 8)}`, // Use existing ID or generate with OpenData prefix
          owner_name: "Public Transport", // Generic owner for open data
          vehicle_type: vehicleType || determineVehicleType(), // Use existing or generate
          lat: lat,
          lng: lng,
          location: { lat, lng },
          speed: speed,
          heading: heading || Math.floor(Math.random() * 360),
          trust_score: Math.floor(70 + Math.random() * 30), // Random trust score
          trust_score_change: 0,
          trust_score_confidence: 0.9,
          status: "Active",
          timestamp: new Date().toISOString()
        };
        vehicles.push(vehicle);
      }
    }
    
    return vehicles;
  } catch (error) {
    console.error("Error transforming OpenData vehicle data:", error);
    return [];
  }
}

export function transformOpenDataCongestionData(apiData: any): CongestionZone[] {
  try {
    const congestionZones: CongestionZone[] = [];
    
    // Try common structures for congestion data
    let congestionData: any[] = [];
    
    if (apiData?.congestion && Array.isArray(apiData.congestion)) {
      congestionData = apiData.congestion;
    } else if (apiData?.data?.congestion && Array.isArray(apiData.data.congestion)) {
      congestionData = apiData.data.congestion;
    } else if (apiData?.trafficConditions && Array.isArray(apiData.trafficConditions)) {
      congestionData = apiData.trafficConditions;
    } else if (apiData?.features && Array.isArray(apiData.features)) {
      // Filter for congestion-related features in GeoJSON
      congestionData = apiData.features.filter((f: any) => 
        f.properties && (f.properties.congestion || f.properties.trafficLevel));
    }
    
    // Process congestion data
    for (const item of congestionData) {
      let lat = 0, lng = 0;
      let zoneName = '';
      let congestionLevel = 0;
      
      // Extract based on common formats
      if (item.geometry && item.geometry.type === 'Point' && Array.isArray(item.geometry.coordinates)) {
        // GeoJSON format
        lng = item.geometry.coordinates[0];
        lat = item.geometry.coordinates[1];
        
        if (item.properties) {
          zoneName = item.properties.name || item.properties.roadName || '';
          congestionLevel = item.properties.congestion || item.properties.trafficLevel || 0;
        }
      } else if (item.lat !== undefined && item.lon !== undefined) {
        lat = item.lat;
        lng = item.lon;
        zoneName = item.name || item.roadName || '';
        congestionLevel = item.congestion || item.trafficLevel || item.level || 0;
      } else if (item.latitude !== undefined && item.longitude !== undefined) {
        lat = item.latitude;
        lng = item.longitude;
        zoneName = item.name || item.roadName || '';
        congestionLevel = item.congestion || item.trafficLevel || item.level || 0;
      }
      
      // Normalize congestion level to 0-100 scale if needed
      if (congestionLevel > 0) {
        if (congestionLevel <= 1) {  // 0-1 scale
          congestionLevel = Math.round(congestionLevel * 100);
        } else if (congestionLevel <= 10) {  // 0-10 scale
          congestionLevel = Math.round(congestionLevel * 10);
        }
      }
      
      // Create congestion zone if we have valid coordinates
      if (lat !== 0 && lng !== 0 && congestionLevel > 0) {
        const congestionZone: CongestionZone = {
          id: `O-${uuidv4().substring(0, 8)}`,
          zone_name: zoneName || `Traffic Zone ${lat.toFixed(4)},${lng.toFixed(4)}`,
          lat: lat,
          lng: lng,
          congestion_level: Math.min(100, congestionLevel),
          updated_at: new Date().toISOString(),
          predicted_by_ml: false,
          ml_confidence: 1
        };
        congestionZones.push(congestionZone);
      }
    }
    
    return congestionZones;
  } catch (error) {
    console.error("Error transforming OpenData congestion data:", error);
    return [];
  }
}

export function transformOpenDataAnomalyData(apiData: any): Anomaly[] {
  try {
    const anomalies: Anomaly[] = [];
    
    // Try common structures for incident data
    let incidentData: any[] = [];
    
    if (apiData?.incidents && Array.isArray(apiData.incidents)) {
      incidentData = apiData.incidents;
    } else if (apiData?.data?.incidents && Array.isArray(apiData.data.incidents)) {
      incidentData = apiData.data.incidents;
    } else if (apiData?.trafficEvents && Array.isArray(apiData.trafficEvents)) {
      incidentData = apiData.trafficEvents;
    } else if (apiData?.features && Array.isArray(apiData.features)) {
      // Filter for incident-related features in GeoJSON
      incidentData = apiData.features.filter((f: any) => 
        f.properties && (f.properties.type === 'incident' || f.properties.eventType));
    }
    
    // Process incident data
    for (const item of incidentData) {
      let lat = 0, lng = 0;
      let incidentType = '';
      let severity = '';
      let description = '';
      let timestamp = '';
      
      // Extract based on common formats
      if (item.geometry && item.geometry.type === 'Point' && Array.isArray(item.geometry.coordinates)) {
        // GeoJSON format
        lng = item.geometry.coordinates[0];
        lat = item.geometry.coordinates[1];
        
        if (item.properties) {
          incidentType = item.properties.type || item.properties.eventType || '';
          severity = item.properties.severity || '';
          description = item.properties.description || '';
          timestamp = item.properties.timestamp || item.properties.startTime || '';
        }
      } else if (item.lat !== undefined && item.lon !== undefined) {
        lat = item.lat;
        lng = item.lon;
        incidentType = item.type || item.eventType || '';
        severity = item.severity || '';
        description = item.description || item.message || '';
        timestamp = item.timestamp || item.startTime || '';
      } else if (item.latitude !== undefined && item.longitude !== undefined) {
        lat = item.latitude;
        lng = item.longitude;
        incidentType = item.type || item.eventType || '';
        severity = item.severity || '';
        description = item.description || item.message || '';
        timestamp = item.timestamp || item.startTime || '';
      }
      
      // Map to our anomaly type
      const anomalyType = mapOpenDataIncidentTypeToAnomalyType(incidentType);
      
      // Map to our severity levels
      const anomalySeverity = mapOpenDataSeverityToAnomalyType(severity);
      
      // Create anomaly if we have valid coordinates
      if (lat !== 0 && lng !== 0) {
        const anomaly: Anomaly = {
          id: `O-${item.id || uuidv4().substring(0, 8)}`,
          timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          vehicle_id: `UNK-${uuidv4().substring(0, 8)}`, // Unknown vehicle for incidents
          type: anomalyType,
          severity: anomalySeverity,
          message: description || "Traffic incident detected",
          status: "Detected",
          ml_confidence: 1.0
        };
        
        anomalies.push(anomaly);
      }
    }
    
    return anomalies;
  } catch (error) {
    console.error("Error transforming OpenData anomaly data:", error);
    return [];
  }
}

/**
 * Helper functions for data mapping
 */

// Randomly determine a vehicle type
function determineVehicleType(): string {
  const vehicleTypes = [
    "Car", "Taxi", "Bus", "Truck", "Two-Wheeler", "Auto-Rickshaw", 
    "Ambulance", "Police Vehicle"
  ];
  
  return vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
}

// Map HERE incident type to our anomaly type
function mapHereIncidentTypeToAnomalyType(hereType: string): string {
  switch (hereType) {
    case "ACCIDENT":
      return "Traffic Accident";
    case "CONGESTION":
      return "Congestion";
    case "CONSTRUCTION":
      return "Road Construction";
    case "DISABLED_VEHICLE":
      return "Vehicle Breakdown";
    case "MASS_TRANSIT":
      return "Public Transport Disruption";
    case "PLANNED_EVENT":
      return "Planned Event";
    case "ROAD_CLOSURE":
      return "Road Closure";
    case "ROAD_HAZARD":
      return "Road Hazard";
    case "WEATHER":
      return "Weather Hazard";
    case "OTHER":
    default:
      return "Traffic Disruption";
  }
}

// Map HERE criticality to our severity levels
function mapHereCriticalityToSeverity(criticality: string): string {
  switch (criticality) {
    case "critical":
      return "Critical";
    case "major":
      return "High";
    case "minor":
      return "Medium";
    case "low impact":
    default:
      return "Low";
  }
}

// Map TomTom incident type to our anomaly type
function mapTomTomIncidentTypeToAnomalyType(tomtomType: string): string {
  switch (tomtomType) {
    case "ACCIDENT":
      return "Traffic Accident";
    case "CONGESTION":
      return "Congestion";
    case "CONSTRUCTION":
      return "Road Construction";
    case "DISABLED_VEHICLE":
      return "Vehicle Breakdown";
    case "LANE_RESTRICTION":
      return "Lane Restriction";
    case "MASS_TRANSIT":
      return "Public Transport Disruption";
    case "PLANNED_EVENT":
      return "Planned Event";
    case "ROAD_CLOSURE":
      return "Road Closure";
    case "ROAD_HAZARD":
      return "Road Hazard";
    case "WEATHER":
      return "Weather Hazard";
    case "OTHER":
    default:
      return "Traffic Disruption";
  }
}

// Map TomTom magnitude to our severity levels
function mapTomTomMagnitudeToSeverity(magnitude: number): string {
  if (!magnitude && magnitude !== 0) return "Medium";
  
  if (magnitude >= 8) return "Critical";
  if (magnitude >= 6) return "High";
  if (magnitude >= 4) return "Medium";
  return "Low";
}

// Map OpenData incident type to our anomaly type
function mapOpenDataIncidentTypeToAnomalyType(openDataType: string): string {
  const lowerType = (openDataType || "").toLowerCase();
  
  if (lowerType.includes("accident")) return "Traffic Accident";
  if (lowerType.includes("congestion")) return "Congestion";
  if (lowerType.includes("construction")) return "Road Construction";
  if (lowerType.includes("breakdown")) return "Vehicle Breakdown";
  if (lowerType.includes("closure")) return "Road Closure";
  if (lowerType.includes("hazard")) return "Road Hazard";
  if (lowerType.includes("weather")) return "Weather Hazard";
  if (lowerType.includes("signal")) return "Traffic Signal Malfunction";
  if (lowerType.includes("police")) return "Police Activity";
  
  return "Traffic Disruption";
}

// Map OpenData severity to our levels
function mapOpenDataSeverityToAnomalyType(severity: string | number): string {
  if (typeof severity === 'number') {
    if (severity >= 8) return "Critical";
    if (severity >= 6) return "High";
    if (severity >= 4) return "Medium";
    return "Low";
  }
  
  const lowerSeverity = (severity || "").toLowerCase();
  
  if (lowerSeverity.includes("critical") || lowerSeverity.includes("severe")) return "Critical";
  if (lowerSeverity.includes("high") || lowerSeverity.includes("major")) return "High";
  if (lowerSeverity.includes("medium") || lowerSeverity.includes("moderate")) return "Medium";
  if (lowerSeverity.includes("low") || lowerSeverity.includes("minor")) return "Low";
  
  return "Medium"; // Default
}
