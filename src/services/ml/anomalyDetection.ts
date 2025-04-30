
import * as tf from '@tensorflow/tfjs';
import { toast } from "@/hooks/use-toast";

let anomalyModel: tf.LayersModel | null = null;

// Initialize and load the anomaly detection model
export const initAnomalyDetectionModel = async (): Promise<boolean> => {
  try {
    console.log("Loading anomaly detection model...");
    
    // For demonstration, we'll create a simple autoencoder model
    // In production, you would load a pre-trained model
    if (!anomalyModel) {
      // Create a simple autoencoder for anomaly detection
      const model = tf.sequential();
      
      // Encoder
      model.add(tf.layers.dense({
        inputShape: [4], // Input features: speed, heading, acceleration, deceleration
        units: 8,
        activation: 'relu'
      }));
      
      // Bottleneck
      model.add(tf.layers.dense({
        units: 2,
        activation: 'relu'
      }));
      
      // Decoder
      model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      model.add(tf.layers.dense({
        units: 4,
        activation: 'linear'
      }));
      
      model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
      });
      
      anomalyModel = model;
      console.log("Anomaly detection model initialized");
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing anomaly detection model:", error);
    toast({
      title: "ML Model Error",
      description: "Failed to initialize anomaly detection model",
      variant: "destructive",
    });
    return false;
  }
};

// Detect if vehicle data represents an anomaly
export const detectAnomaly = async (
  vehicleData: {
    speed?: number;
    heading?: number;
    lat: number;
    lng: number;
    vehicle_id: string;
  }
): Promise<{
  isAnomaly: boolean;
  anomalyScore: number;
  type: string;
  severity: string;
}> => {
  try {
    if (!anomalyModel) {
      await initAnomalyDetectionModel();
      if (!anomalyModel) throw new Error("Model not initialized");
    }
    
    // Extract features
    const speed = vehicleData.speed || 0;
    const heading = vehicleData.heading || 0;
    const acceleration = 0; // Would be calculated from time series in real implementation
    const deceleration = 0; // Would be calculated from time series in real implementation
    
    // Create tensor from features
    const input = tf.tensor2d([[speed / 100, heading / 360, acceleration, deceleration]]);
    
    // Get reconstruction
    const output = anomalyModel.predict(input) as tf.Tensor;
    const inputData = await input.data();
    const outputData = await output.data();
    
    // Calculate reconstruction error (MSE)
    let errorSum = 0;
    for (let i = 0; i < inputData.length; i++) {
      errorSum += Math.pow(inputData[i] - outputData[i], 2);
    }
    const mse = errorSum / inputData.length;
    
    // Define anomaly threshold
    const ANOMALY_THRESHOLD = 0.1;
    const isAnomaly = mse > ANOMALY_THRESHOLD;
    
    // Determine anomaly type and severity based on error patterns
    let type = "Normal Operation";
    let severity = "Low";
    
    if (isAnomaly) {
      // Simplified logic - would be more sophisticated in real implementation
      if (mse > 0.3) {
        severity = "Critical";
        type = "Erratic Movement";
      } else if (mse > 0.2) {
        severity = "High";
        type = "Speed Violation";
      } else {
        severity = "Medium";
        type = "Unusual Pattern";
      }
    }
    
    return {
      isAnomaly,
      anomalyScore: mse,
      type,
      severity
    };
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return {
      isAnomaly: false,
      anomalyScore: 0,
      type: "Unknown",
      severity: "Low"
    };
  }
};

// Process vehicle data to detect anomalies
export const processVehiclesForAnomalies = async (vehicles: any[]): Promise<any[]> => {
  try {
    const anomalies = [];
    
    for (const vehicle of vehicles) {
      const anomalyResult = await detectAnomaly(vehicle);
      
      if (anomalyResult.isAnomaly) {
        anomalies.push({
          id: `anomaly-${Date.now()}-${vehicle.vehicle_id}`,
          timestamp: new Date().toISOString(),
          vehicle_id: vehicle.vehicle_id,
          type: anomalyResult.type,
          severity: anomalyResult.severity,
          message: `Detected ${anomalyResult.severity.toLowerCase()} anomaly: ${anomalyResult.type}`,
          status: "Detected",
          ml_confidence: anomalyResult.anomalyScore * 10
        });
      }
    }
    
    return anomalies;
  } catch (error) {
    console.error("Error processing vehicles for anomalies:", error);
    return [];
  }
};
