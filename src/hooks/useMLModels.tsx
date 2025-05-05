
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';

// Global state to track loaded models
const loadedModels = {
  traffic: false,
  anomaly: false,
  trust: false,
  route: false
};

// Global flag to prevent multiple parallel loading operations
let isLoadingModels = false;

export const useMLModels = (loadImmediately = false) => {
  const [isModelLoading, setIsModelLoading] = useState<boolean>(loadImmediately);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(
    loadedModels.traffic && loadedModels.anomaly && loadedModels.trust && loadedModels.route
  );
  const [modelLoadingProgress, setModelLoadingProgress] = useState<number>(0);
  const [activeBackend, setActiveBackend] = useState<string>("");

  // Initialize TensorFlow backend
  const setupTensorflow = useCallback(async () => {
    if (!activeBackend) {
      try {
        // Try to use WebGL, fall back to CPU if not available
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
          console.log("Set TensorFlow.js backend to WebGL");
        }
        
        setActiveBackend(tf.getBackend());
        
        // Improve memory management
        const safetyThreshold = 0.7; // Start clearing when memory usage reaches 70%
        const currentBackend = tf.getBackend();
        
        if (currentBackend === 'webgl') {
          // Monitor WebGL memory and clear when needed
          setInterval(() => {
            try {
              const memoryInfo = tf.memory();
              if (memoryInfo.numBytesInGPU) {
                const numBytesInGPUUsed = memoryInfo.numBytesInGPU;
                const numBytesInGPUMax = memoryInfo.numBytesInGPUMax || numBytesInGPUUsed * 1.5;
                const usedRatio = numBytesInGPUUsed / numBytesInGPUMax;
                
                if (usedRatio > safetyThreshold) {
                  console.log(`Clearing TensorFlow memory (usage: ${(usedRatio * 100).toFixed(0)}%)`);
                  tf.tidy(() => {}); // Force garbage collection
                }
              }
            } catch (error) {
              console.warn("Error checking TensorFlow memory:", error);
            }
          }, 10000); // Check every 10 seconds
        }
      } catch (error) {
        console.warn("Failed to set WebGL backend, using default:", error);
        setActiveBackend(tf.getBackend() || "unknown");
      }
    }
  }, [activeBackend]);

  // Initialize specific ML model by name with progress tracking
  const initializeModel = useCallback(async (
    modelName: 'traffic' | 'anomaly' | 'trust' | 'route', 
    initFn: () => Promise<boolean>,
    progressStart: number,
    progressEnd: number
  ) => {
    if (loadedModels[modelName]) {
      setModelLoadingProgress(progressEnd);
      return true;
    }
    
    try {
      setModelLoadingProgress(progressStart);
      const result = await initFn();
      loadedModels[modelName] = result;
      setModelLoadingProgress(progressEnd);
      return result;
    } catch (error) {
      console.error(`Error initializing ${modelName} model:`, error);
      return false;
    }
  }, []);
  
  // Lazy load only the models needed for current operation
  const loadTrafficModel = useCallback(async () => {
    if (loadedModels.traffic) return true;
    const { initTrafficPredictionModel } = await import('@/services/ml');
    return initializeModel('traffic', initTrafficPredictionModel, 0, 25);
  }, [initializeModel]);
  
  const loadAnomalyModel = useCallback(async () => {
    if (loadedModels.anomaly) return true;
    const { initAnomalyDetectionModel } = await import('@/services/ml');
    return initializeModel('anomaly', initAnomalyDetectionModel, 25, 50);
  }, [initializeModel]);
  
  const loadTrustModel = useCallback(async () => {
    if (loadedModels.trust) return true;
    const { initTrustScoringModel } = await import('@/services/ml');
    return initializeModel('trust', initTrustScoringModel, 50, 75);
  }, [initializeModel]);
  
  const loadRouteModel = useCallback(async () => {
    if (loadedModels.route) return true;
    const { initRouteOptimizationModel } = await import('@/services/ml');
    return initializeModel('route', initRouteOptimizationModel, 75, 100);
  }, [initializeModel]);

  // Initialize all ML models
  const initializeModels = useCallback(async () => {
    if (isLoadingModels) {
      console.log("Models already loading, skipping duplicate initialization");
      return;
    }
    
    isLoadingModels = true;
    setIsModelLoading(true);
    setModelLoadingProgress(0);
    
    try {
      // Set backend to WebGL if available for better performance
      await setupTensorflow();
      
      // Load models sequentially
      await loadTrafficModel();
      await loadAnomalyModel();
      await loadTrustModel();
      await loadRouteModel();
      
      const allLoaded = 
        loadedModels.traffic && 
        loadedModels.anomaly && 
        loadedModels.trust && 
        loadedModels.route;
      
      setModelsLoaded(allLoaded);
      
      if (allLoaded) {
        toast({
          title: "ML Models Loaded",
          description: "Traffic prediction and analysis models are now active.",
        });
      } else {
        toast({
          title: "Partial ML Models Loaded",
          description: "Some ML models could not be loaded. Some features may be limited.",
          variant: "destructive",
        });
      }
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
      isLoadingModels = false;
    }
  }, [setupTensorflow, loadTrafficModel, loadAnomalyModel, loadTrustModel, loadRouteModel]);

  // Exposed function to load only specific models based on need
  const loadModelsByType = useCallback(async (types: Array<'traffic' | 'anomaly' | 'trust' | 'route'>) => {
    if (isLoadingModels) return false;
    
    isLoadingModels = true;
    setIsModelLoading(true);
    
    try {
      await setupTensorflow();
      
      const loaders = {
        'traffic': loadTrafficModel,
        'anomaly': loadAnomalyModel,
        'trust': loadTrustModel,
        'route': loadRouteModel
      };
      
      const results = await Promise.all(
        types.map(type => loaders[type]())
      );
      
      const success = results.every(Boolean);
      
      if (success) {
        console.log(`Successfully loaded ML models: ${types.join(', ')}`);
      }
      
      // Check if all models are now loaded
      const allLoaded = 
        loadedModels.traffic && 
        loadedModels.anomaly && 
        loadedModels.trust && 
        loadedModels.route;
      
      setModelsLoaded(allLoaded);
      
      return success;
    } catch (error) {
      console.error("Error loading specific models:", error);
      return false;
    } finally {
      setIsModelLoading(false);
      isLoadingModels = false;
    }
  }, [setupTensorflow, loadTrafficModel, loadAnomalyModel, loadTrustModel, loadRouteModel]);

  // Initialize models on component mount if loadImmediately is true
  useEffect(() => {
    if (loadImmediately && !modelsLoaded && !isModelLoading) {
      initializeModels();
    }
  }, [loadImmediately, initializeModels, modelsLoaded, isModelLoading]);

  return {
    isModelLoading,
    modelsLoaded,
    modelLoadingProgress,
    initializeModels,
    loadModelsByType,
    activeBackend
  };
};
