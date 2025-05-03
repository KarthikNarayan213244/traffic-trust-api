
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

let anomalyModel: tf.LayersModel | null = null;
let isModelLoading = false;

// Constants for anomaly detection
const ANOMALY_THRESHOLDS = {
  MINOR: 0.05,
  MEDIUM: 0.1,
  HIGH: 0.2,
  CRITICAL: 0.3
};

// Anomaly patterns to detect
const ANOMALY_PATTERNS = {
  SPEED_VIOLATION: 'Speed Violation',
  ERRATIC_MOVEMENT: 'Erratic Movement',
  SUDDEN_STOP: 'Sudden Stop',
  UNAUTHORIZED_ZONE: 'Unauthorized Zone Entry',
  SIGNAL_INTERFERENCE: 'Signal Interference',
  SUSPICIOUS_PATTERN: 'Suspicious Pattern',
  EMERGENCY_SITUATION: 'Emergency Situation'
};

// Initialize and load the enhanced anomaly detection model
export const initAnomalyDetectionModel = async (): Promise<boolean> => {
  if (anomalyModel) return true;
  if (isModelLoading) return false;
  
  isModelLoading = true;
  
  try {
    console.log("Loading enhanced anomaly detection model...");
    
    // First try to load a pre-trained model if available
    try {
      anomalyModel = await tf.loadLayersModel('indexeddb://anomaly-detection-model');
      console.log("Loaded anomaly detection model from IndexedDB");
      isModelLoading = false;
      return true;
    } catch (loadError) {
      console.log("No pre-trained model found, creating a new one", loadError);
    }
    
    // Create a more sophisticated autoencoder model for anomaly detection
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      inputShape: [8], // Expanded input features for better detection
      units: 16,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l1({ l1: 1e-4 })
    }));
    
    // Encoder layers with dropout for robustness
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    // Bottleneck layer with batch normalization
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dense({
      units: 4,
      activation: 'relu'
    }));
    
    // Decoder layers
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    // Output layer
    model.add(tf.layers.dense({
      units: 8,
      activation: 'sigmoid'
    }));
    
    // Compile with advanced optimizer settings
    model.compile({
      optimizer: tf.train.adam(0.001), // Fixed: using numeric learning rate directly
      loss: 'meanSquaredError',
    });
    
    anomalyModel = model;
    
    // Save the model to IndexedDB for future use
    await anomalyModel.save('indexeddb://anomaly-detection-model');
    
    console.log("Enhanced anomaly detection model initialized and saved");
    return true;
  } catch (error) {
    console.error("Error initializing enhanced anomaly detection model:", error);
    toast({
      title: "ML Model Error",
      description: "Failed to initialize anomaly detection model",
      variant: "destructive",
    });
    return false;
  } finally {
    isModelLoading = false;
  }
};

// Preprocess vehicle data for anomaly detection
const preprocessVehicleData = (vehicleData: any) => {
  // Extract and normalize features
  const speed = vehicleData.speed || 0;
  const heading = vehicleData.heading || 0;
  const acceleration = vehicleData.acceleration || 0;
  const deceleration = vehicleData.deceleration || 0;
  const turnRate = vehicleData.turn_rate || 0;
  const stopFrequency = vehicleData.stop_frequency || 0;
  const laneChangeRate = vehicleData.lane_change_rate || 0;
  const timeSinceMoved = vehicleData.time_since_moved || 0;
  
  // Return normalized tensor
  return tf.tensor2d([
    [
      speed / 150, // Normalize speed (max 150 km/h)
      heading / 360, // Normalize heading (0-360 degrees)
      acceleration / 10, // Normalize acceleration
      deceleration / 10, // Normalize deceleration
      turnRate / 90, // Normalize turn rate
      Math.min(stopFrequency, 10) / 10, // Normalize stop frequency
      Math.min(laneChangeRate, 5) / 5, // Normalize lane changes
      Math.min(timeSinceMoved, 300) / 300 // Normalize time since last moved (max 5 min)
    ]
  ]);
};

// Enhanced anomaly detection with more sophisticated analysis
export const detectAnomaly = async (vehicleData: {
  speed?: number;
  heading?: number;
  lat: number;
  lng: number;
  vehicle_id: string;
  vehicle_type?: string;
  acceleration?: number;
  deceleration?: number;
  turn_rate?: number;
  stop_frequency?: number;
  lane_change_rate?: number;
  time_since_moved?: number;
  timestamp?: string;
  trusted?: boolean;
}): Promise<{
  isAnomaly: boolean;
  anomalyScore: number;
  type: string;
  severity: string;
  confidence: number;
  details?: string;
}> => {
  try {
    if (!anomalyModel) {
      const initialized = await initAnomalyDetectionModel();
      if (!initialized) throw new Error("Model not initialized");
    }
    
    // Preprocess data
    const input = preprocessVehicleData(vehicleData);
    
    // Get reconstruction
    const output = anomalyModel.predict(input) as tf.Tensor;
    
    // Calculate reconstruction error (MSE)
    const inputData = await input.data();
    const outputData = await output.data();
    
    let errorSum = 0;
    const featureErrors = [];
    
    for (let i = 0; i < inputData.length; i++) {
      const featureError = Math.pow(inputData[i] - outputData[i], 2);
      errorSum += featureError;
      featureErrors.push(featureError);
    }
    
    const mse = errorSum / inputData.length;
    
    // Clean up tensors
    input.dispose();
    output.dispose();
    
    // Determine if anomaly based on refined thresholds
    const isAnomaly = mse > ANOMALY_THRESHOLDS.MINOR;
    
    // Enhanced anomaly analysis
    let type = "Normal Operation";
    let severity = "Low";
    let confidence = 0;
    let details = "";
    
    if (isAnomaly) {
      // Analyze which features contributed most to the anomaly
      const maxErrorFeature = featureErrors.indexOf(Math.max(...featureErrors));
      const secondMaxErrorFeature = featureErrors.indexOf(Math.max(...featureErrors.filter((_, i) => i !== maxErrorFeature)));
      
      // Map feature indices to anomaly types
      const featureToAnomalyMap = [
        ANOMALY_PATTERNS.SPEED_VIOLATION, // speed
        ANOMALY_PATTERNS.ERRATIC_MOVEMENT, // heading
        ANOMALY_PATTERNS.ERRATIC_MOVEMENT, // acceleration
        ANOMALY_PATTERNS.SUDDEN_STOP, // deceleration
        ANOMALY_PATTERNS.ERRATIC_MOVEMENT, // turn rate
        ANOMALY_PATTERNS.SUSPICIOUS_PATTERN, // stop frequency
        ANOMALY_PATTERNS.SUSPICIOUS_PATTERN, // lane change rate
        ANOMALY_PATTERNS.UNAUTHORIZED_ZONE // time since moved
      ];
      
      // Determine anomaly type based on which features are most anomalous
      type = featureToAnomalyMap[maxErrorFeature];
      
      // Special case for emergency vehicles
      if (vehicleData.vehicle_type?.toLowerCase().includes('emergency') || 
          vehicleData.vehicle_type?.toLowerCase().includes('ambulance') || 
          vehicleData.vehicle_type?.toLowerCase().includes('police')) {
        type = ANOMALY_PATTERNS.EMERGENCY_SITUATION;
      }
      
      // Determine severity based on overall anomaly score
      if (mse > ANOMALY_THRESHOLDS.CRITICAL) {
        severity = "Critical";
        confidence = 0.95;
      } else if (mse > ANOMALY_THRESHOLDS.HIGH) {
        severity = "High";
        confidence = 0.85;
      } else if (mse > ANOMALY_THRESHOLDS.MEDIUM) {
        severity = "Medium";
        confidence = 0.75;
      } else {
        severity = "Low";
        confidence = 0.6;
      }
      
      // Generate detailed explanation
      details = `Anomaly detected in ${featureToAnomalyMap[maxErrorFeature]} and ${featureToAnomalyMap[secondMaxErrorFeature]}`;
    } else {
      confidence = 0.9; // High confidence in normal operation
    }
    
    return {
      isAnomaly,
      anomalyScore: mse,
      type,
      severity,
      confidence,
      details
    };
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return {
      isAnomaly: false,
      anomalyScore: 0,
      type: "Unknown",
      severity: "Low",
      confidence: 0
    };
  }
};

// Process vehicle data to detect anomalies with enhanced detection
export const processVehiclesForAnomalies = async (vehicles: any[]): Promise<any[]> => {
  try {
    if (!vehicles || vehicles.length === 0) return [];
    
    const anomalies = [];
    let processedCount = 0;
    const batchSize = 50; // Process vehicles in batches to avoid blocking UI
    
    // Process vehicles in batches
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      
      // Process each batch in parallel
      const batchResults = await Promise.all(
        batch.map(vehicle => detectAnomaly(vehicle))
      );
      
      // Add detected anomalies to results
      for (let j = 0; j < batch.length; j++) {
        const vehicle = batch[j];
        const anomalyResult = batchResults[j];
        
        if (anomalyResult.isAnomaly) {
          anomalies.push({
            id: `anomaly-${Date.now()}-${processedCount++}-${vehicle.vehicle_id}`,
            timestamp: new Date().toISOString(),
            vehicle_id: vehicle.vehicle_id,
            type: anomalyResult.type,
            severity: anomalyResult.severity,
            message: `Detected ${anomalyResult.severity.toLowerCase()} anomaly: ${anomalyResult.type}`,
            details: anomalyResult.details || "",
            status: "Detected",
            ml_confidence: anomalyResult.confidence * 100,
            location: {
              lat: vehicle.lat,
              lng: vehicle.lng
            }
          });
        }
      }
      
      // Allow UI to update between batches
      if (i + batchSize < vehicles.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return anomalies;
  } catch (error) {
    console.error("Error processing vehicles for anomalies:", error);
    return [];
  }
};

// Advanced anomaly threat assessment for emergency response
export const assessAnomalyThreat = async (anomaly: any, vehicles: any[], rsus: any[]) => {
  try {
    if (!anomaly) return { threatLevel: "Unknown", responseRecommendation: "None" };
    
    // Find the vehicle associated with this anomaly
    const vehicle = vehicles.find(v => v.vehicle_id === anomaly.vehicle_id);
    if (!vehicle) return { threatLevel: "Unknown", responseRecommendation: "None" };
    
    // Calculate threat level based on anomaly severity and context
    let threatScore = 0;
    
    // Severity contributes to threat
    switch (anomaly.severity) {
      case "Critical": threatScore += 80; break;
      case "High": threatScore += 60; break;
      case "Medium": threatScore += 40; break;
      case "Low": threatScore += 20; break;
      default: threatScore += 10;
    }
    
    // Vehicle type affects threat assessment
    if (vehicle.vehicle_type?.toLowerCase().includes('heavy') || 
        vehicle.vehicle_type?.toLowerCase().includes('truck') ||
        vehicle.vehicle_type?.toLowerCase().includes('bus')) {
      threatScore += 15; // Heavier vehicles pose more risk
    }
    
    // Count nearby vehicles (within 200m)
    let nearbyVehicleCount = 0;
    for (const otherVehicle of vehicles) {
      if (otherVehicle.vehicle_id === vehicle.vehicle_id) continue;
      
      const distance = calculateDistance(
        vehicle.lat, vehicle.lng,
        otherVehicle.lat, otherVehicle.lng
      );
      
      if (distance < 0.2) { // 200m in km
        nearbyVehicleCount++;
      }
    }
    
    // More nearby vehicles means higher risk
    threatScore += Math.min(nearbyVehicleCount * 2, 20); // Cap at 20 points
    
    // Check if any RSUs are nearby and active
    let hasActiveRsuNearby = false;
    for (const rsu of rsus) {
      if (rsu.status !== 'Active') continue;
      
      const distance = calculateDistance(
        vehicle.lat, vehicle.lng,
        rsu.lat, rsu.lng
      );
      
      if (distance < (rsu.coverage_radius || 500) / 1000) { // Convert to km
        hasActiveRsuNearby = true;
        break;
      }
    }
    
    // No active RSUs nearby increases threat
    if (!hasActiveRsuNearby) {
      threatScore += 15;
    }
    
    // Determine threat level
    let threatLevel = "Low";
    if (threatScore > 90) threatLevel = "Extreme";
    else if (threatScore > 70) threatLevel = "Critical";
    else if (threatScore > 50) threatLevel = "High";
    else if (threatScore > 30) threatLevel = "Medium";
    
    // Generate response recommendation
    let responseRecommendation = "Monitor";
    if (threatLevel === "Extreme") {
      responseRecommendation = "Immediate emergency response required";
    } else if (threatLevel === "Critical") {
      responseRecommendation = "Dispatch emergency services";
    } else if (threatLevel === "High") {
      responseRecommendation = "Alert nearby vehicles and traffic control";
    } else if (threatLevel === "Medium") {
      responseRecommendation = "Increase monitoring and prepare response units";
    }
    
    return { 
      threatLevel, 
      responseRecommendation,
      threatScore,
      hasActiveRsuNearby,
      nearbyVehicleCount
    };
  } catch (error) {
    console.error("Error assessing anomaly threat:", error);
    return { threatLevel: "Unknown", responseRecommendation: "None" };
  }
};

// Helper function to calculate distance between two coordinates
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

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
