import { v4 as uuidv4 } from 'uuid';
import { Vehicle, CongestionZone, Anomaly, RSU } from '../types';
import { HYDERABAD_BOUNDING_BOX } from './config';

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
  if (!apiData || !apiData.flowSegmentData) {
    console.warn('No flow segment data received from TomTom API');
    return [];
  }

  try {
    // Generate synthetic vehicles based on flow segments
    const vehicles: Vehicle[] = [];
    
    // Use flow segment coordinates to place vehicles
    if (apiData.flowSegmentData.coordinates && apiData.flowSegmentData.coordinates.coordinate) {
      const coordinates = apiData.flowSegmentData.coordinates.coordinate;
      const currentSpeed = apiData.flowSegmentData.currentSpeed || 30;
      const freeFlowSpeed = apiData.flowSegmentData.freeFlowSpeed || 60;
      
      // Calculate trust score based on ratio of current to free flow speed (higher ratio = higher trust)
      const speedRatio = Math.min(currentSpeed / freeFlowSpeed, 1);
      const baseTrustScore = Math.round(60 + speedRatio * 40); // Score between 60-100
      
      // Generate vehicles along the flow segment 
      for (let i = 0; i < Math.min(coordinates.length, 20); i++) {
        if (i % 2 === 0) { // Only use some of the coordinates to avoid too many vehicles
          const coord = coordinates[i];
          
          // Skip points outside our bounding box
          if (coord.latitude < HYDERABAD_BOUNDING_BOX.south || 
              coord.latitude > HYDERABAD_BOUNDING_BOX.north || 
              coord.longitude < HYDERABAD_BOUNDING_BOX.west || 
              coord.longitude > HYDERABAD_BOUNDING_BOX.east) {
            continue;
          }
          
          // Calculate heading from this point to the next
          let heading = 0;
          if (i < coordinates.length - 1) {
            const nextCoord = coordinates[i + 1];
            heading = Math.round(calculateHeading(coord.latitude, coord.longitude, 
                                                 nextCoord.latitude, nextCoord.longitude));
          }
          
          // Generate a vehicle
          const vehicle: Vehicle = {
            vehicle_id: `TT-${Math.floor(10000 + Math.random() * 90000)}`, // Synthetic ID
            owner_name: "Traffic Flow Vehicle",
            vehicle_type: getRandomVehicleType(),
            trust_score: baseTrustScore + Math.floor(Math.random() * 10),
            lat: coord.latitude,
            lng: coord.longitude,
            location: { lat: coord.latitude, lng: coord.longitude },
            speed: currentSpeed + Math.floor(Math.random() * 10 - 5), // Add some variation
            heading: heading,
            status: "Active",
            timestamp: new Date().toISOString(),
            trust_score_change: 0,
            trust_score_confidence: 0.8 + Math.random() * 0.2
          };
          
          vehicles.push(vehicle);
        }
      }
    }
    
    return vehicles;
  } catch (error) {
    console.error('Error transforming TomTom vehicle data:', error);
    return [];
  }
}

export function transformTomTomCongestionData(apiData: any): CongestionZone[] {
  if (!apiData || !apiData.flowSegmentData) {
    console.warn('No flow segment data received from TomTom API');
    return [];
  }

  try {
    const congestionZones: CongestionZone[] = [];
    
    // Create congestion zones from the flow data
    if (apiData.flowSegmentData) {
      const flowData = apiData.flowSegmentData;
      
      if (flowData.coordinates && flowData.coordinates.coordinate) {
        // Use the start and end of segment plus some interesting points along the way
        const coordinates = flowData.coordinates.coordinate;
        const roadName = flowData.roadName || 'Road Segment';
        
        // Get congestion level based on current/freeflow speed
        const currentSpeed = flowData.currentSpeed || 0;
        const freeFlowSpeed = flowData.freeFlowSpeed || 1;
        const congestionRatio = 1 - (currentSpeed / freeFlowSpeed);
        const congestionLevel = Math.min(100, Math.max(0, Math.round(congestionRatio * 100)));
        
        // Create congestion zones at some points along the segment
        const pointsToUse = [0, Math.floor(coordinates.length / 2), coordinates.length - 1];
        
        for (const index of pointsToUse) {
          if (index < coordinates.length) {
            const coord = coordinates[index];
            
            // Skip points outside our bounding box
            if (coord.latitude < HYDERABAD_BOUNDING_BOX.south || 
                coord.latitude > HYDERABAD_BOUNDING_BOX.north || 
                coord.longitude < HYDERABAD_BOUNDING_BOX.west || 
                coord.longitude > HYDERABAD_BOUNDING_BOX.east) {
              continue;
            }
            
            const zone: CongestionZone = {
              id: `tt-cong-${Date.now()}-${index}`,
              zone_name: `${roadName} ${index}`,
              lat: coord.latitude,
              lng: coord.longitude,
              congestion_level: congestionLevel,
              updated_at: new Date().toISOString()
            };
            
            congestionZones.push(zone);
          }
        }
      }
    }
    
    return congestionZones;
  } catch (error) {
    console.error('Error transforming TomTom congestion data:', error);
    return [];
  }
}

export function transformTomTomAnomalyData(apiData: any): Anomaly[] {
  if (!apiData || !apiData.incidents || !apiData.incidents.length) {
    console.warn('No incident data received from TomTom API');
    return [];
  }

  try {
    const anomalies: Anomaly[] = [];
    
    for (const incident of apiData.incidents) {
      if (!incident.point) continue;
      
      // Get coordinates
      const latitude = incident.point.coordinates.latitude;
      const longitude = incident.point.coordinates.longitude;
      
      // Skip if outside our bounding box
      if (latitude < HYDERABAD_BOUNDING_BOX.south || 
          latitude > HYDERABAD_BOUNDING_BOX.north || 
          longitude < HYDERABAD_BOUNDING_BOX.west || 
          longitude > HYDERABAD_BOUNDING_BOX.east) {
        continue;
      }
      
      // Map TomTom severity to our severity levels
      let severity = 'Medium';
      if (incident.criticality) {
        switch (incident.criticality) {
          case 0: severity = 'Low'; break;
          case 1: severity = 'Medium'; break;
          case 2: severity = 'High'; break;
          case 3:
          case 4: severity = 'Critical'; break;
          default: severity = 'Medium';
        }
      }
      
      // Create anomaly object
      const anomaly: Anomaly = {
        id: incident.id || `tt-anomaly-${Date.now()}-${anomalies.length}`,
        vehicle_id: `TT-${Math.floor(10000 + Math.random() * 90000)}`, // Synthetic vehicle ID
        timestamp: new Date().toISOString(),
        type: mapTomTomIncidentType(incident.type || 0),
        severity: severity,
        message: incident.description || 'Traffic incident detected',
        status: 'Detected',
        location: {
          lat: latitude,
          lng: longitude
        }
      };
      
      anomalies.push(anomaly);
    }
    
    return anomalies;
  } catch (error) {
    console.error('Error transforming TomTom anomaly data:', error);
    return [];
  }
}

/**
 * Transforms OpenData API data into our Vehicle, CongestionZone and Anomaly models
 */
export function transformOpenDataTraffic(apiData: any): {
  vehicles: Vehicle[];
  congestion: CongestionZone[];
  anomalies: Anomaly[];
} {
  try {
    const vehicles: Vehicle[] = [];
    const congestion: CongestionZone[] = [];
    const anomalies: Anomaly[] = [];
    
    // Try common structures in open data APIs
    let vehicleData: any[] = [];
    let congestionData: any[] = [];
    let incidentData: any[] = [];
    
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
    
    // Try common structures for congestion data
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
        congestion.push(congestionZone);
      }
    }
    
    // Try common structures for incident data
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
    
    return { vehicles, congestion, anomalies };
  } catch (error) {
    console.error("Error transforming OpenData traffic data:", error);
    return { vehicles: [], congestion: [], anomalies: [] };
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
function mapTomTomIncidentType(tomtomType: number): string {
  // TomTom incident types: https://developer.tomtom.com/traffic-api/documentation/traffic-incident/incident-details
  switch(tomtomType) {
    case 1: return 'Traffic Signal Violation';
    case 2: return 'Accident';
    case 3: return 'Road Closure';
    case 6: return 'Speed Violation';
    case 7: return 'Restricted Zone Entry';
    case 8: return 'Traffic Congestion';
    case 9: return 'Erratic Driving Pattern';
    case 10: return 'Weather Incident';
    case 11: return 'Hazard';
    default: return 'Traffic Anomaly';
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

/**
 * Helper function to calculate heading between two points
 */
function calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  if (bearing < 0) {
    bearing += 360;
  }
  return bearing;
}

/**
 * Helper function to get a random vehicle type
 */
function getRandomVehicleType(): string {
  const types = ['Car', 'Two-Wheeler', 'Taxi', 'Bus', 'Truck', 'Auto-Rickshaw'];
  return types[Math.floor(Math.random() * types.length)];
}
