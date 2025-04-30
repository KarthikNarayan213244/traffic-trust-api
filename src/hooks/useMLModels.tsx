
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';
import { 
  initTrafficPredictionModel,
  initAnomalyDetectionModel,
  initTrustScoringModel,
  initRouteOptimizationModel
} from "@/services/ml";

export const useMLModels = () => {
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);

  // Initialize all ML models
  const initializeModels = useCallback(async () => {
    setIsModelLoading(true);
    setModelLoadingProgress(0);
    
    try {
      // Set backend to WebGL if available for better performance
      await tf.setBackend('webgl');
      console.log("TensorFlow.js backend:", tf.getBackend());
      
      // Update progress manually since registerCallbackTracker doesn't exist
      setModelLoadingProgress(10);

      // Traffic prediction model
      await initTrafficPredictionModel();
      setModelLoadingProgress(25);
      
      // Anomaly detection model
      await initAnomalyDetectionModel();
      setModelLoadingProgress(50);
      
      // Trust scoring model
      await initTrustScoringModel();
      setModelLoadingProgress(75);
      
      // Route optimization model
      await initRouteOptimizationModel();
      setModelLoadingProgress(100);
      
      setModelsLoaded(true);
      toast({
        title: "ML Models Loaded",
        description: "Traffic prediction and analysis models are now active.",
      });
    } catch (error) {
      console.error("Error initializing ML models:", error);
      toast({
        title: "ML Model Error",
        description: "Failed to initialize some ML models. Some features may be limited.",
        variant: "destructive",
      });
      setModelsLoaded(false);
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  // Initialize models on component mount
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  return {
    isModelLoading,
    modelsLoaded,
    modelLoadingProgress,
    initializeModels
  };
};
