
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log(`ML inference request received: ${action}`);

    switch (action) {
      case 'predict_congestion':
        return handleCongestionPrediction(data);
      case 'detect_anomalies':
        return handleAnomalyDetection(data);
      case 'calculate_trust':
        return handleTrustCalculation(data);
      case 'optimize_route':
        return handleRouteOptimization(data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`Error in ML inference: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCongestionPrediction(data: any) {
  console.log("Processing congestion prediction for zones");
  
  // In a real implementation, we'd use a proper ML model here
  // For now, simulate a prediction with some randomized intelligence
  
  const predictions = data.zones.map((zone: any) => {
    // Base prediction on historical data with some randomization
    const currentCongestion = zone.congestion_level || 0;
    const timeOfDay = new Date().getHours();
    
    // Factors that influence congestion
    const isRushHour = timeOfDay >= 7 && timeOfDay <= 9 || timeOfDay >= 17 && timeOfDay <= 19;
    const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;
    
    // Simulate ML prediction with reasonable patterns
    let predictedChange = 0;
    
    if (isRushHour && isWeekday) {
      // Rush hour on weekdays - congestion likely to increase
      predictedChange = Math.random() * 20 - 5; // -5 to +15 with bias towards increase
    } else if (timeOfDay >= 22 || timeOfDay <= 5) {
      // Late night - congestion likely to decrease
      predictedChange = Math.random() * 20 - 15; // -15 to +5 with bias towards decrease
    } else {
      // Regular hours - moderate changes
      predictedChange = Math.random() * 20 - 10; // -10 to +10 balanced
    }
    
    // Ensure congestion stays between 0-100
    const newCongestion = Math.max(0, Math.min(100, currentCongestion + predictedChange));
    
    return {
      zone_id: zone.id || zone.zone_id,
      current_congestion: currentCongestion,
      predicted_congestion: Math.round(newCongestion),
      confidence: 0.7 + Math.random() * 0.2, // 0.7-0.9 confidence range
      factors: {
        time_of_day: timeOfDay,
        is_rush_hour: isRushHour,
        is_weekday: isWeekday
      }
    };
  });
  
  // Insert the predictions into Supabase
  if (data.persist) {
    try {
      for (const prediction of predictions) {
        await supabase
          .from('congestion_predictions')
          .insert({
            zone_id: prediction.zone_id,
            current_level: prediction.current_congestion,
            predicted_level: prediction.predicted_congestion,
            confidence: prediction.confidence,
            factors: prediction.factors,
            created_at: new Date().toISOString()
          });
      }
      console.log(`Stored ${predictions.length} congestion predictions`);
    } catch (error) {
      console.error(`Error storing predictions: ${error.message}`);
    }
  }
  
  return new Response(
    JSON.stringify({ 
      predictions,
      model_version: "traffic-flow-v2.1",
      inference_time_ms: Math.round(50 + Math.random() * 100)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnomalyDetection(data: any) {
  console.log(`Processing anomaly detection for ${data.vehicles?.length || 0} vehicles`);
  
  // In a real implementation, we'd use a proper ML model here
  // For now, simulate anomaly detection with some intelligence
  
  const anomalies = [];
  const threshold = 0.92; // Higher threshold means fewer anomalies
  
  for (const vehicle of (data.vehicles || [])) {
    // Random factors that might contribute to anomaly detection
    const speed = vehicle.speed || 0;
    const speedLimit = 60; // Simulated speed limit
    const recentBraking = Math.random() < 0.1;
    const erraticMovement = Math.random() < 0.05;
    const inspectionStatus = Math.random() < 0.95 ? 'valid' : 'expired';
    
    // Simulated anomaly detection
    let anomalyScore = 0;
    let anomalyType = null;
    let severity = 'Low';
    
    // Check for speeding
    if (speed > speedLimit * 1.25) {
      anomalyScore += 0.7;
      anomalyType = 'Excessive Speed';
      severity = 'High';
    } else if (speed > speedLimit * 1.1) {
      anomalyScore += 0.4;
      anomalyType = 'Speeding';
      severity = 'Medium';
    }
    
    // Check for erratic movement
    if (erraticMovement) {
      anomalyScore += 0.6;
      anomalyType = anomalyType || 'Erratic Movement';
      severity = 'Medium';
    }
    
    // Check for sudden braking
    if (recentBraking && speed > speedLimit) {
      anomalyScore += 0.5;
      anomalyType = 'Sudden Braking';
      severity = 'Medium';
    }
    
    // Check for expired inspection
    if (inspectionStatus === 'expired') {
      anomalyScore += 0.3;
      anomalyType = anomalyType || 'Expired Inspection';
      severity = 'Low';
    }
    
    // Add randomness to make it more realistic
    anomalyScore += (Math.random() * 0.2) - 0.1;
    
    // If anomaly score passes threshold, record it
    if (anomalyScore > threshold) {
      anomalies.push({
        vehicle_id: vehicle.vehicle_id,
        timestamp: new Date().toISOString(),
        type: anomalyType || 'Unknown Issue',
        severity: severity,
        score: anomalyScore,
        details: {
          speed,
          location: { lat: vehicle.lat, lng: vehicle.lng },
          detection_confidence: Math.round((anomalyScore - threshold) * 100) / 100 + threshold
        }
      });
    }
  }
  
  // Insert the anomalies into Supabase
  if (data.persist && anomalies.length > 0) {
    try {
      const { error } = await supabase
        .from('anomalies')
        .insert(anomalies.map(a => ({
          vehicle_id: a.vehicle_id,
          timestamp: a.timestamp,
          type: a.type,
          severity: a.severity,
          message: `Detected ${a.type} with ${a.details.detection_confidence.toFixed(2)} confidence`,
          status: 'Detected'
        })));
        
      if (error) {
        throw error;
      }
        
      console.log(`Stored ${anomalies.length} anomalies`);
    } catch (error) {
      console.error(`Error storing anomalies: ${error.message}`);
    }
  }
  
  return new Response(
    JSON.stringify({ 
      anomalies,
      model_version: "anomaly-detect-v1.7",
      inference_time_ms: Math.round(30 + Math.random() * 80)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleTrustCalculation(data: any) {
  console.log(`Calculating trust scores for ${data.vehicles?.length || 0} vehicles`);
  
  // In a real implementation, we'd use a proper ML model here
  // For now, simulate trust calculation with realistic factors
  
  const trustScores = (data.vehicles || []).map((vehicle: any) => {
    // Get current trust score or default
    const currentTrust = vehicle.trust_score || 70;
    
    // Factors that influence trust
    const vehicleAnomalies = (data.anomalies || []).filter((a: any) => 
      a.vehicle_id === vehicle.vehicle_id
    );
    
    const anomalyCount = vehicleAnomalies.length;
    const severeCounts = vehicleAnomalies.filter((a: any) => 
      a.severity === 'High' || a.severity === 'Critical'
    ).length;
    
    // Age of vehicle registration (simulated)
    const registrationAge = Math.random() * 5; // 0-5 years
    
    // Calculate trust change based on factors
    let trustChange = 0;
    
    // Decrease for anomalies
    trustChange -= anomalyCount * 2;
    trustChange -= severeCounts * 5;
    
    // Slight bonus for older registrations (established history)
    trustChange += registrationAge * 0.5;
    
    // Small random factor
    trustChange += (Math.random() * 2) - 1;
    
    // Update trust score
    let newTrustScore = Math.max(0, Math.min(100, currentTrust + trustChange));
    
    // Round for cleaner display
    newTrustScore = Math.round(newTrustScore);
    
    return {
      vehicle_id: vehicle.vehicle_id,
      old_score: currentTrust,
      new_score: newTrustScore,
      change: Math.round(trustChange * 10) / 10,
      factors: {
        anomaly_count: anomalyCount,
        severe_anomalies: severeCounts,
        registration_age: registrationAge.toFixed(1) + " years"
      },
      confidence: 0.75 + Math.random() * 0.2
    };
  });
  
  // Update the vehicles in Supabase
  if (data.persist && trustScores.length > 0) {
    try {
      for (const score of trustScores) {
        // Only update if there's an actual change
        if (score.old_score !== score.new_score) {
          await supabase
            .from('vehicles')
            .update({ trust_score: score.new_score })
            .eq('vehicle_id', score.vehicle_id);
        }
      }
      console.log(`Updated trust scores for ${trustScores.length} vehicles`);
    } catch (error) {
      console.error(`Error updating trust scores: ${error.message}`);
    }
  }
  
  return new Response(
    JSON.stringify({ 
      trust_scores: trustScores,
      model_version: "trust-scoring-v1.3",
      inference_time_ms: Math.round(40 + Math.random() * 60)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleRouteOptimization(data: any) {
  console.log("Processing route optimization request");
  
  const { origin, destination, congestion_data = [] } = data;
  
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }
  
  // In a real implementation, we'd use proper routing algorithms with ML
  // For now, simulate route optimization with congestion awareness
  
  // Step 1: Calculate direct route as baseline
  const directDistance = calculateDistance(origin, destination);
  
  // Step 2: Find congestion hotspots along the route
  const congestionHotspots = findCongestionHotspots(origin, destination, congestion_data);
  
  // Step 3: Generate waypoints to avoid congestion
  const waypoints = generateOptimalWaypoints(origin, destination, congestionHotspots);
  
  // Step 4: Calculate route metadata
  const routeDetails = {
    distance_km: Math.round((directDistance + (Math.random() * 0.3 - 0.1)) * 10) / 10,
    estimated_time_mins: Math.round(directDistance * 2 + waypoints.length * 2),
    congestion_avoided: congestionHotspots.length,
    confidence: 0.7 + Math.random() * 0.25
  };
  
  return new Response(
    JSON.stringify({ 
      waypoints,
      route_details: routeDetails,
      travel_mode: "DRIVING", 
      avoidances: ["tolls", "highCongestion"],
      optimization_confidence: routeDetails.confidence,
      model_version: "route-optimizer-v2.0",
      inference_time_ms: Math.round(150 + Math.random() * 100)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
function calculateDistance(point1: any, point2: any) {
  // Haversine formula for distance between two points
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

function findCongestionHotspots(origin: any, destination: any, congestion_data: any[]) {
  // Find congestion zones that might affect the route
  const hotspots = [];
  
  // Calculate bounding box for the route with some buffer
  const minLat = Math.min(origin.lat, destination.lat) - 0.03;
  const maxLat = Math.max(origin.lat, destination.lat) + 0.03;
  const minLng = Math.min(origin.lng, destination.lng) - 0.03;
  const maxLng = Math.max(origin.lng, destination.lng) + 0.03;
  
  // Find congestion zones in this area with high congestion
  for (const zone of congestion_data) {
    if (
      zone.lat >= minLat && zone.lat <= maxLat &&
      zone.lng >= minLng && zone.lng <= maxLng &&
      zone.congestion_level > 70 // Only care about high congestion
    ) {
      hotspots.push({
        location: { lat: zone.lat, lng: zone.lng },
        congestion_level: zone.congestion_level,
        radius: (zone.congestion_level / 20) * 0.005 // Higher congestion = larger radius
      });
    }
  }
  
  return hotspots;
}

function generateOptimalWaypoints(origin: any, destination: any, congestionHotspots: any[]) {
  const waypoints = [];
  
  if (congestionHotspots.length === 0) {
    // No congestion to avoid, return direct route
    return waypoints;
  }
  
  // Calculate midpoint of route
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  
  // Calculate perpendicular direction to generate detour
  const routeVector = {
    lat: destination.lat - origin.lat,
    lng: destination.lng - origin.lng
  };
  
  const perpVector = {
    lat: -routeVector.lng,
    lng: routeVector.lat
  };
  
  // Normalize perpendicular vector
  const perpLength = Math.sqrt(perpVector.lat * perpVector.lat + perpVector.lng * perpVector.lng);
  perpVector.lat /= perpLength;
  perpVector.lng /= perpLength;
  
  // Generate waypoints that avoid the hotspots
  // For each severe congestion zone, add a waypoint to detour around it
  let detourCount = 0;
  
  for (const hotspot of congestionHotspots) {
    if (hotspot.congestion_level > 85) {
      // For severe congestion, calculate a detour
      const detourDistance = 0.01 + (Math.random() * 0.01); // 0.01-0.02 degrees
      const detourDirection = detourCount % 2 === 0 ? 1 : -1; // Alternate sides
      
      waypoints.push({
        location: new google.maps.LatLng(
          hotspot.location.lat + (perpVector.lat * detourDistance * detourDirection),
          hotspot.location.lng + (perpVector.lng * detourDistance * detourDirection)
        ),
        stopover: false
      });
      
      detourCount++;
    }
  }
  
  // If multiple detours, add a waypoint after the last hotspot
  if (detourCount > 1) {
    // Find point along route past the hotspots
    const routeFraction = 0.75;
    waypoints.push({
      location: new google.maps.LatLng(
        origin.lat + (routeVector.lat * routeFraction),
        origin.lng + (routeVector.lng * routeFraction)
      ),
      stopover: false
    });
  }
  
  return waypoints;
}
