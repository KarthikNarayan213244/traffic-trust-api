
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

let routeModel: tf.LayersModel | null = null;
let isModelLoading = false;

// Advanced emergency route optimization weights
const ROUTE_WEIGHTS = {
  CONGESTION: 0.35,
  DISTANCE: 0.25,
  EMERGENCY_ACCESS: 0.20,
  RSU_COVERAGE: 0.10,
  ROAD_QUALITY: 0.05,
  TIME_OF_DAY: 0.05
};

// Initialize and load the enhanced route optimization model
export const initRouteOptimizationModel = async (): Promise<boolean> => {
  if (routeModel) return true;
  if (isModelLoading) return false;
  
  isModelLoading = true;
  
  try {
    console.log("Loading advanced emergency route optimization model...");
    
    // First try to load a pre-trained model if available
    try {
      routeModel = await tf.loadLayersModel('indexeddb://route-optimization-model');
      console.log("Loaded route optimization model from IndexedDB");
      isModelLoading = false;
      return true;
    } catch (loadError) {
      console.log("No pre-trained route model found, creating a new one", loadError);
    }
    
    // Create a more sophisticated model for route optimization
    const model = tf.sequential();
    
    // Input layer with more features for better routing
    model.add(tf.layers.dense({
      inputShape: [12], // Expanded input features
      units: 24,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l1({ l1: 1e-4 })
    }));
    
    // Hidden layers
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    // Output layer for route parameters
    model.add(tf.layers.dense({
      units: 6, // More output parameters
      activation: 'linear'
    }));
    
    model.compile({
      optimizer: tf.train.adam({ learningRate: 0.001 }),
      loss: 'meanSquaredError',
    });
    
    routeModel = model;
    
    // Save the model to IndexedDB for future use
    await routeModel.save('indexeddb://route-optimization-model');
    
    console.log("Advanced route optimization model initialized and saved");
    return true;
  } catch (error) {
    console.error("Error initializing route optimization model:", error);
    toast({
      title: "ML Model Error",
      description: "Failed to initialize route optimization model",
      variant: "destructive",
    });
    return false;
  } finally {
    isModelLoading = false;
  }
};

// Enhanced route optimization for emergency vehicles
export const optimizeEmergencyRoute = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  options: {
    emergencyType?: 'ambulance' | 'police' | 'fire' | 'general';
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    trafficData?: any[];
    congestionData?: any[];
    rsuData?: any[];
    avoidHighways?: boolean;
    avoidTolls?: boolean;
  } = {}
): Promise<{
  waypoints: google.maps.DirectionsWaypoint[];
  routePreference: google.maps.TravelMode;
  avoidances: string[];
  optimizationConfidence: number;
  estimatedTimeMinutes?: number;
  suggestedRouteColor?: string;
  alternativeRoutes?: any[];
}> => {
  try {
    // Ensure model is loaded
    if (!routeModel) {
      await initRouteOptimizationModel();
    }
    
    const {
      emergencyType = 'ambulance',
      urgencyLevel = 'high',
      trafficData = [],
      congestionData = [],
      rsuData = [],
      avoidHighways = false,
      avoidTolls = false
    } = options;
    
    console.log(`Optimizing emergency route for ${emergencyType} with ${urgencyLevel} urgency`);
    
    // Prepare routing parameters based on emergency type
    let urgencyFactor = 0.5;
    switch (urgencyLevel) {
      case 'critical': urgencyFactor = 1.0; break;
      case 'high': urgencyFactor = 0.8; break;
      case 'medium': urgencyFactor = 0.6; break;
      case 'low': urgencyFactor = 0.4; break;
    }
    
    // Get current time factor (rush hour vs night)
    const hourOfDay = new Date().getHours();
    const isRushHour = (hourOfDay >= 7 && hourOfDay <= 10) || (hourOfDay >= 16 && hourOfDay <= 19);
    const timeOfDayFactor = isRushHour ? 1.0 : 0.4;
    
    // Different emergency types have different routing priorities
    const routeTypeFactors = {
      ambulance: { congestionWeight: 0.8, distanceWeight: 0.6, highwayPreference: 0.7 },
      police: { congestionWeight: 0.6, distanceWeight: 0.8, highwayPreference: 0.5 },
      fire: { congestionWeight: 0.9, distanceWeight: 0.7, highwayPreference: 0.4 },
      general: { congestionWeight: 0.7, distanceWeight: 0.7, highwayPreference: 0.6 }
    };
    
    const { congestionWeight, distanceWeight, highwayPreference } = routeTypeFactors[emergencyType as keyof typeof routeTypeFactors];
    
    // Find congestion between origin and destination
    const routeCongestion = analyzeCongestionOnRoute(origin, destination, congestionData);
    
    // Find RSU coverage along the route
    const rsuCoverage = analyzeRsuCoverage(origin, destination, rsuData);
    
    // Advanced routing features
    // These would typically be extracted from an API or geospatial database
    const hasDedicatedLanes = false; // Emergency lanes availability
    const hasTrafficLightControl = true; // Ability to control traffic lights
    const roadQuality = 0.6; // Estimated road quality on scale of 0-1
    
    // Combine all factors to create optimized route
    
    // Generate waypoints to avoid congested areas
    const waypoints = generateOptimalWaypoints(
      origin, 
      destination, 
      congestionData,
      rsuData,
      {
        congestionWeight: congestionWeight * urgencyFactor,
        distanceWeight,
        rsuCoverageWeight: 0.4,
        timeOfDayFactor,
        avoidHighways
      }
    );
    
    // Determine best travel mode
    let routePreference = google.maps.TravelMode.DRIVING;
    
    // Determine avoidances
    const avoidances: string[] = [];
    
    if (avoidHighways && highwayPreference < 0.5) {
      avoidances.push('highways');
    }
    
    if (avoidTolls) {
      avoidances.push('tolls');
    }
    
    // Check for particularly high congestion
    if (routeCongestion > 0.8) {
      avoidances.push('traffic');
    }
    
    // Route confidence based on available data
    let optimizationConfidence = 0.5; // Base confidence
    
    // Adjust based on available data
    if (congestionData.length > 10) optimizationConfidence += 0.1;
    if (rsuData.length > 5) optimizationConfidence += 0.1;
    if (hasDedicatedLanes) optimizationConfidence += 0.1;
    if (hasTrafficLightControl) optimizationConfidence += 0.1;
    
    // Route color based on emergency type
    let suggestedRouteColor = "#ff0000"; // Default red
    switch (emergencyType) {
      case 'ambulance': suggestedRouteColor = "#ff0000"; break; // Red
      case 'police': suggestedRouteColor = "#0000ff"; break; // Blue  
      case 'fire': suggestedRouteColor = "#ff6b00"; break; // Orange
      case 'general': suggestedRouteColor = "#00bf00"; break; // Green
    }
    
    // Estimate travel time (in minutes)
    const distance = calculateDistance(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );
    
    // Base speed on emergency type and congestion
    let averageSpeedKmh = 60; // Default
    switch (emergencyType) {
      case 'ambulance': averageSpeedKmh = 70; break;
      case 'police': averageSpeedKmh = 80; break;
      case 'fire': averageSpeedKmh = 60; break;
      case 'general': averageSpeedKmh = 50; break;
    }
    
    // Adjust for congestion
    averageSpeedKmh *= (1 - (routeCongestion * 0.7));
    
    // Calculate estimated time in minutes
    const estimatedTimeMinutes = Math.round((distance / averageSpeedKmh) * 60);
    
    return {
      waypoints,
      routePreference,
      avoidances,
      optimizationConfidence,
      estimatedTimeMinutes,
      suggestedRouteColor
    };
  } catch (error) {
    console.error("Error optimizing emergency route:", error);
    
    // Return a safe fallback
    return {
      waypoints: [],
      routePreference: google.maps.TravelMode.DRIVING,
      avoidances: [],
      optimizationConfidence: 0.2
    };
  }
};

// Helper: Calculate congestion level between two points
function analyzeCongestionOnRoute(origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral, congestionData: any[]): number {
  if (!congestionData || congestionData.length === 0) return 0.5; // Default moderate congestion
  
  // Find congestion zones between origin and destination
  const relevantCongestion = congestionData.filter(zone => {
    // Check if zone is roughly between origin and destination
    return isPointBetween(zone.location || { lat: zone.lat, lng: zone.lng }, origin, destination, 0.2);
  });
  
  if (relevantCongestion.length === 0) return 0.3; // Low congestion if no data
  
  // Calculate average congestion level
  const totalCongestion = relevantCongestion.reduce((sum, zone) => {
    return sum + (zone.congestion_level || 50); // Default to 50 if not available
  }, 0);
  
  return Math.min(1, (totalCongestion / (relevantCongestion.length * 100)));
}

// Helper: Calculate RSU coverage between two points
function analyzeRsuCoverage(origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral, rsuData: any[]): number {
  if (!rsuData || rsuData.length === 0) return 0; // No RSU coverage
  
  // Find active RSUs between origin and destination
  const relevantRsus = rsuData.filter(rsu => {
    return rsu.status === 'Active' && isPointBetween(
      { lat: rsu.lat, lng: rsu.lng },
      origin,
      destination,
      0.5
    );
  });
  
  // Basic coverage calculation
  // In a real system, this would analyze the actual coverage areas more precisely
  const routeDistance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const coverageEstimate = Math.min(1, relevantRsus.length / (routeDistance * 2));
  
  return coverageEstimate;
}

// Helper: Generate optimal waypoints to avoid congestion
function generateOptimalWaypoints(
  origin: google.maps.LatLngLiteral, 
  destination: google.maps.LatLngLiteral,
  congestionData: any[],
  rsuData: any[],
  options: any
): google.maps.DirectionsWaypoint[] {
  const waypoints: google.maps.DirectionsWaypoint[] = [];
  const { congestionWeight, distanceWeight, rsuCoverageWeight, avoidHighways } = options;
  
  // If no congestion data, we can't optimize effectively
  if (!congestionData || congestionData.length < 5) {
    return waypoints;
  }
  
  try {
    // Get congestion hotspots on direct route
    const hotspots = congestionData
      .filter(zone => {
        const zoneLocation = zone.location || { lat: zone.lat, lng: zone.lng };
        return isPointBetween(zoneLocation, origin, destination, 0.2) && 
               (zone.congestion_level || 0) > 70;
      })
      .sort((a, b) => (b.congestion_level || 0) - (a.congestion_level || 0))
      .slice(0, 3); // Consider top 3 most congested areas
    
    // If we have congestion hotspots to avoid
    if (hotspots.length > 0) {
      // Find active RSUs with good coverage
      const activeRsus = rsuData
        .filter(rsu => rsu.status === 'Active')
        .sort((a, b) => (b.coverage_radius || 0) - (a.coverage_radius || 0));
      
      // For each hotspot, try to find a waypoint that avoids it
      for (const hotspot of hotspots) {
        const hotspotLocation = hotspot.location || { lat: hotspot.lat, lng: hotspot.lng };
        
        // Generate a detour waypoint
        let detourPoint = generateDetourPoint(
          origin, destination, hotspotLocation,
          // Try to detour through areas with RSU coverage
          activeRsus.length > 0 ? activeRsus[0] : null,
          congestionWeight,
          distanceWeight
        );
        
        if (detourPoint) {
          waypoints.push({
            location: new google.maps.LatLng(detourPoint.lat, detourPoint.lng)
          });
          
          // Limit to 3 waypoints for Google Maps API
          if (waypoints.length >= 3) break;
        }
      }
    }
    
    return waypoints;
  } catch (error) {
    console.error("Error generating optimal waypoints:", error);
    return [];
  }
}

// Helper: Generate a detour point to avoid congestion
function generateDetourPoint(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  congestionPoint: google.maps.LatLngLiteral,
  nearbyRsu: any | null,
  congestionWeight: number,
  distanceWeight: number
): google.maps.LatLngLiteral | null {
  try {
    // Calculate bearing of direct route
    const directBearing = calculateBearing(origin, destination);
    
    // Determine which side to detour to
    // We'll try both sides and pick the better one
    const detourOptions = [
      calculateDetourPoint(origin, destination, congestionPoint, directBearing + 90),
      calculateDetourPoint(origin, destination, congestionPoint, directBearing - 90)
    ];
    
    // If we have an RSU nearby, consider it in our detour
    if (nearbyRsu) {
      const rsuLocation = { lat: nearbyRsu.lat, lng: nearbyRsu.lng };
      const rsuDetour = {
        point: rsuLocation,
        score: scoreDetourPoint(
          origin, destination, congestionPoint, rsuLocation,
          congestionWeight, distanceWeight, true
        )
      };
      detourOptions.push(rsuDetour);
    }
    
    // Score and select the best detour
    let bestDetour = null;
    let bestScore = -Infinity;
    
    for (const detour of detourOptions) {
      if (detour && detour.score > bestScore) {
        bestScore = detour.score;
        bestDetour = detour.point;
      }
    }
    
    return bestDetour;
  } catch (error) {
    console.error("Error generating detour point:", error);
    return null;
  }
}

// Helper: Calculate a potential detour point
function calculateDetourPoint(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  avoidPoint: google.maps.LatLngLiteral,
  detourBearing: number
): { point: google.maps.LatLngLiteral, score: number } | null {
  try {
    // Calculate distance to congestion
    const distanceToCongestion = calculateDistance(
      origin.lat, origin.lng,
      avoidPoint.lat, avoidPoint.lng
    );
    
    // Determine detour distance based on congestion distance
    // Longer detour for points further away
    const detourDistance = Math.min(0.5, distanceToCongestion * 0.3);
    
    // Calculate detour point coordinates
    const detourPoint = destinationPoint(avoidPoint, detourBearing, detourDistance);
    
    // Score this detour
    const score = scoreDetourPoint(
      origin, destination, avoidPoint, detourPoint,
      0.7, 0.3, false
    );
    
    return { point: detourPoint, score };
  } catch (error) {
    console.error("Error calculating detour point:", error);
    return null;
  }
}

// Helper: Score a potential detour point
function scoreDetourPoint(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  congestionPoint: google.maps.LatLngLiteral,
  detourPoint: google.maps.LatLngLiteral,
  congestionWeight: number,
  distanceWeight: number,
  isRsu: boolean
): number {
  // Calculate distance from congestion point to detour
  const distanceFromCongestion = calculateDistance(
    congestionPoint.lat, congestionPoint.lng,
    detourPoint.lat, detourPoint.lng
  );
  
  // Calculate total route distance through detour
  const directDistance = calculateDistance(
    origin.lat, origin.lng, destination.lat, destination.lng
  );
  
  const detourDistance = 
    calculateDistance(origin.lat, origin.lng, detourPoint.lat, detourPoint.lng) +
    calculateDistance(detourPoint.lat, detourPoint.lng, destination.lat, destination.lng);
  
  // Detour efficiency: How much extra distance are we adding?
  const detourEfficiency = 1 - Math.min(1, (detourDistance - directDistance) / directDistance);
  
  // Congestion avoidance: How far are we from the congestion?
  const congestionAvoidance = Math.min(1, distanceFromCongestion / 1.5);
  
  // Bonus for detours that go through RSUs
  const rsuBonus = isRsu ? 0.2 : 0;
  
  // Calculate final score
  return (congestionAvoidance * congestionWeight) + 
         (detourEfficiency * distanceWeight) + 
         rsuBonus;
}

// Helper: Calculate bearing between two points
function calculateBearing(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral): number {
  const startLat = deg2rad(start.lat);
  const startLng = deg2rad(start.lng);
  const endLat = deg2rad(end.lat);
  const endLng = deg2rad(end.lng);
  
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  
  let bearing = Math.atan2(y, x);
  bearing = rad2deg(bearing);
  return (bearing + 360) % 360;
}

// Helper: Calculate destination point given start point, bearing and distance
function destinationPoint(start: google.maps.LatLngLiteral, bearing: number, distance: number): google.maps.LatLngLiteral {
  const R = 6371; // Earth's radius in km
  const d = distance; // distance in km
  
  const lat1 = deg2rad(start.lat);
  const lon1 = deg2rad(start.lng);
  const brng = deg2rad(bearing);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d/R) + 
    Math.cos(lat1) * Math.sin(d/R) * Math.cos(brng)
  );
  
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d/R) * Math.cos(lat1),
    Math.cos(d/R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: rad2deg(lat2),
    lng: rad2deg(lon2)
  };
}

// Helper: Check if a point is roughly between two other points
function isPointBetween(
  point: google.maps.LatLngLiteral,
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral,
  buffer: number = 0.1
): boolean {
  // Create a bounding box with buffer
  const minLat = Math.min(start.lat, end.lat) - buffer;
  const maxLat = Math.max(start.lat, end.lat) + buffer;
  const minLng = Math.min(start.lng, end.lng) - buffer;
  const maxLng = Math.max(start.lng, end.lng) + buffer;
  
  // Check if point is within the bounding box
  return point.lat >= minLat && 
         point.lat <= maxLat && 
         point.lng >= minLng && 
         point.lng <= maxLng;
}

// Helper: Distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

// Helper: Degrees to radians
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Helper: Radians to degrees
function rad2deg(rad: number): number {
  return rad * (180/Math.PI);
}
