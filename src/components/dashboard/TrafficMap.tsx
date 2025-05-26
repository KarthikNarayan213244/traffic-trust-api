
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import { fetchVehicles, fetchCongestionData, fetchRSUs, fetchAnomalies } from "@/services/api";
import MLControls from "./MLControls";
import ApiKeyControl from "./ApiKeyControl";
import SmartTrafficSimulation from "./SmartTrafficSimulation";
import RealisticAttackSimulation from "./RealisticAttackSimulation";
import { useMapData } from "@/hooks/useMapData";
import { useMLSimulation } from "@/hooks/useMLSimulation";
import { useMapApiKey } from "@/hooks/useMapApiKey";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  updateCongestionData, 
  processVehiclesForAnomalies, 
  updateTrustScores,
  updateRsuTrustScores 
} from "@/services/ml";

interface TrafficMapProps {
  vehicles?: any[];
  rsus?: any[];
  isLoading?: boolean;
  congestionData?: any[];
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  vehicles: initialVehicles = [],
  rsus: initialRsus = [],
  isLoading: initialLoading = false,
  congestionData: initialCongestionData = []
}) => {
  // Custom hooks to manage state
  const { apiKey, handleApiKeySet, keyIsSet, isFirstLoadComplete, getLoaderId } = useMapApiKey();
  const { vehicles, rsus, congestionData, anomalies, isLoading, setVehicles, setRsus, setCongestionData, setAnomalies } = useMapData(
    initialVehicles, 
    initialRsus, 
    initialCongestionData, 
    initialLoading
  );
  
  const { 
    isLiveMonitoring, selectedAmbulance, destination, modelAccuracy, optimizedRoute,
    isModelLoading, modelsLoaded, modelLoadingProgress, loadModelsByType,
    toggleLiveMonitoring, handleAmbulanceSelect, handleDestinationSelect, resetRouting,
    changeModelAccuracy, getIntervals 
  } = useMLSimulation(false); // Start with live monitoring off
  
  const [mlUpdateCountdown, setMlUpdateCountdown] = useState<number>(0);
  const [mapsInitialized, setMapsInitialized] = useState<boolean>(false);
  const [activeIntervals, setActiveIntervals] = useState<{[key: string]: NodeJS.Timeout | null}>({});
  const [lastIntervalRun, setLastIntervalRun] = useState<{[key: string]: number}>({});

  // Memoize the loader options to ensure they don't change between renders
  // Only initialize if we have an API key to prevent conflicts
  const loaderOptions = useMemo(() => {
    if (!keyIsSet || !apiKey) {
      return null;
    }
    
    return {
      googleMapsApiKey: apiKey, 
      libraries,
      id: getLoaderId(),
    };
  }, [apiKey, keyIsSet, getLoaderId]);

  // Only initialize the maps API if we have a key and loader options
  const { isLoaded, loadError } = useJsApiLoader(loaderOptions || {
    googleMapsApiKey: "",
    libraries,
    id: getLoaderId(),
  });

  // Update maps initialization status
  useEffect(() => {
    if (isLoaded && !mapsInitialized && keyIsSet) {
      console.log("Google Maps API loaded successfully");
      setMapsInitialized(true);
    }
  }, [isLoaded, mapsInitialized, keyIsSet]);

  // Clear all intervals
  const clearAllIntervals = useCallback(() => {
    Object.values(activeIntervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    setActiveIntervals({});
  }, [activeIntervals]);

  // Function to check if an operation should run based on throttling
  const shouldRunOperation = useCallback((operationKey: string, minInterval: number = 5000) => {
    const now = Date.now();
    const lastRun = lastIntervalRun[operationKey] || 0;
    
    // Don't run if it's been less than minInterval since last run
    if (now - lastRun < minInterval) {
      return false;
    }
    
    // Update last run time
    setLastIntervalRun(prev => ({
      ...prev,
      [operationKey]: now
    }));
    
    return true;
  }, [lastIntervalRun]);

  // Function to fetch and process data
  const fetchAndProcessData = useCallback(async (dataType: 'vehicles' | 'congestion' | 'rsus' | 'anomalies') => {
    if (!shouldRunOperation(dataType)) return;
    
    try {
      switch (dataType) {
        case 'vehicles':
          console.log("Fetching vehicle data...");
          const vehicleData = await fetchVehicles({ limit: 1000 });
          if (Array.isArray(vehicleData)) {
            setVehicles(vehicleData);
            console.log(`Updated ${vehicleData.length} vehicles`);
          }
          break;
          
        case 'congestion':
          console.log("Fetching congestion data...");
          const congestionResult = await fetchCongestionData({ limit: 500 });
          if (Array.isArray(congestionResult)) {
            setCongestionData(congestionResult);
            console.log(`Updated ${congestionResult.length} congestion data points`);
          }
          break;
          
        case 'rsus':
          console.log("Fetching RSU data...");
          const rsuData = await fetchRSUs({ limit: 100 });
          if (Array.isArray(rsuData)) {
            setRsus(rsuData);
            console.log(`Updated ${rsuData.length} RSUs`);
          }
          break;
          
        case 'anomalies':
          console.log("Fetching anomaly data...");
          const anomalyData = await fetchAnomalies({ limit: 200 });
          if (Array.isArray(anomalyData)) {
            setAnomalies(anomalyData);
            console.log(`Updated ${anomalyData.length} anomalies`);
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
    }
  }, [setVehicles, setCongestionData, setRsus, setAnomalies, shouldRunOperation]);

  // ML processing with throttling
  const runMLProcessing = useCallback(async (processingType: 'anomalyDetection' | 'congestionPrediction' | 'trustScoring' | 'rsuTrustScoring') => {
    if (!modelsLoaded || !shouldRunOperation(processingType, 10000)) return;
    
    try {
      switch (processingType) {
        case 'anomalyDetection':
          // Lazy load only the needed model
          await loadModelsByType(['anomaly']);
          console.log("Processing vehicles for anomalies...");
          const detectedAnomalies = await processVehiclesForAnomalies(vehicles);
          if (detectedAnomalies.length > 0) {
            setAnomalies(prev => [...detectedAnomalies, ...prev]);
            console.log(`Detected ${detectedAnomalies.length} new anomalies using ML`);
          }
          break;
          
        case 'congestionPrediction':
          // Lazy load only the needed model
          await loadModelsByType(['traffic']);
          console.log("Updating congestion predictions...");
          const updatedCongestion = await updateCongestionData(congestionData);
          setCongestionData(updatedCongestion);
          console.log(`Updated ${updatedCongestion.length} congestion data points with ML predictions`);
          break;
          
        case 'trustScoring':
          // Lazy load only the needed model
          await loadModelsByType(['trust']);
          console.log("Updating vehicle trust scores...");
          const updatedVehicles = await updateTrustScores(vehicles, anomalies);
          setVehicles(updatedVehicles);
          console.log(`Updated trust scores for ${updatedVehicles.length} vehicles using ML`);
          break;
          
        case 'rsuTrustScoring':
          // Lazy load only the needed model
          await loadModelsByType(['trust']);
          console.log("Updating RSU trust scores...");
          const updatedRsus = await updateRsuTrustScores(rsus, anomalies);
          setRsus(updatedRsus);
          console.log(`Updated trust scores for ${updatedRsus.length} RSUs using ML`);
          break;
      }
    } catch (error) {
      console.error(`Error in ML processing (${processingType}):`, error);
    }
  }, [vehicles, congestionData, rsus, anomalies, modelsLoaded, setVehicles, setCongestionData, setRsus, setAnomalies, loadModelsByType, shouldRunOperation]);

  // Setup intervals with dynamic timing based on model accuracy
  useEffect(() => {
    // Clean up previous intervals
    clearAllIntervals();
    
    if (!isLiveMonitoring) return;
    
    const intervals = getIntervals();
    // Increase minimum intervals to prevent overloading
    const minIntervals = {
      vehicles: Math.max(10000, intervals.vehicles),
      congestion: Math.max(60000, intervals.congestion),
      rsus: Math.max(45000, intervals.rsus),
      modelUpdate: Math.max(120000, intervals.modelUpdate)
    };
    
    // Data fetch intervals
    const vehicleInterval = setInterval(() => {
      fetchAndProcessData('vehicles');
    }, minIntervals.vehicles);
    
    const congestionInterval = setInterval(() => {
      fetchAndProcessData('congestion');
    }, minIntervals.congestion);
    
    const rsuInterval = setInterval(() => {
      fetchAndProcessData('rsus');
    }, minIntervals.rsus);
    
    // ML processing intervals (with longer intervals)
    const anomalyInterval = setInterval(() => {
      if (modelsLoaded) {
        runMLProcessing('anomalyDetection');
      }
    }, minIntervals.vehicles * 2);
    
    const congestionPredictionInterval = setInterval(() => {
      if (modelsLoaded) {
        runMLProcessing('congestionPrediction');
      }
    }, minIntervals.congestion * 1.5);
    
    const trustInterval = setInterval(() => {
      if (modelsLoaded) {
        runMLProcessing('trustScoring');
      }
    }, minIntervals.modelUpdate);
    
    const rsuTrustInterval = setInterval(() => {
      if (modelsLoaded) {
        runMLProcessing('rsuTrustScoring');
      }
    }, minIntervals.modelUpdate);
    
    // ML model update countdown
    const countdownInterval = setInterval(() => {
      setMlUpdateCountdown(prev => {
        if (prev <= 0) {
          return Math.floor(minIntervals.modelUpdate / 1000);
        }
        return prev - 1;
      });
    }, 1000);
    
    // Store active intervals
    setActiveIntervals({
      vehicleInterval,
      congestionInterval,
      rsuInterval,
      anomalyInterval,
      congestionPredictionInterval,
      trustInterval,
      rsuTrustInterval,
      countdownInterval
    });
    
    // Run initial data processing
    if (modelsLoaded) {
      (async () => {
        // Load all required models first
        await loadModelsByType(['traffic', 'anomaly', 'trust']);
        
        // Stagger operations to prevent simultaneous processing
        setTimeout(() => runMLProcessing('congestionPrediction'), 1000);
        setTimeout(() => runMLProcessing('anomalyDetection'), 3000);
        setTimeout(() => runMLProcessing('trustScoring'), 5000);
        setTimeout(() => runMLProcessing('rsuTrustScoring'), 7000);
      })();
    }
    
    return clearAllIntervals;
  }, [isLiveMonitoring, modelsLoaded, getIntervals, clearAllIntervals, fetchAndProcessData, runMLProcessing, loadModelsByType]);

  // Add visibility change detection to pause processing when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, pausing processing");
        clearAllIntervals();
      } else if (isLiveMonitoring) {
        console.log("Page visible, resuming processing");
        // Force a re-render which will re-establish intervals
        setLastIntervalRun({});
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLiveMonitoring, clearAllIntervals]);

  // Render functions
  const renderApiKeyNeeded = () => {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 flex-col">
        <p className="text-lg mb-4">Google Maps API Key Required</p>
        <MapApiKeyForm onApiKeySet={handleApiKeySet} />
      </div>
    );
  };

  const renderLoadingError = () => {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <h3 className="text-lg font-medium text-red-600">Failed to load Google Maps</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please check your internet connection and API key, then try again
          </p>
          <div className="mt-4">
            <MapApiKeyForm onApiKeySet={handleApiKeySet} />
          </div>
        </div>
      </div>
    );
  };

  const renderLoadingSkeleton = () => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  };

  const renderLoadingMaps = () => {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Loading maps...</span>
      </div>
    );
  };

  // The render function where the map and controls are rendered
  const renderMap = () => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <MLControls
            isLiveMonitoring={isLiveMonitoring}
            selectedAmbulance={selectedAmbulance}
            modelAccuracy={modelAccuracy}
            toggleLiveMonitoring={toggleLiveMonitoring}
            resetRouting={resetRouting}
            changeModelAccuracy={changeModelAccuracy}
            modelProgress={isModelLoading ? modelLoadingProgress : 100}
          />
          
          <ApiKeyControl
            apiKey={apiKey}
            onApiKeySet={handleApiKeySet}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            {/* Only render the GoogleMapDisplay when the Google Maps API is loaded and we have a key */}
            {isLoaded && keyIsSet && (
              <GoogleMapDisplay 
                vehicles={vehicles} 
                rsus={rsus} 
                congestionData={congestionData} 
                isLiveMonitoring={isLiveMonitoring}
                selectedAmbulance={selectedAmbulance}
                onAmbulanceSelect={handleAmbulanceSelect}
                destination={destination}
                optimizedRoute={optimizedRoute}
                onMapClick={(latLng) => handleDestinationSelect(latLng, congestionData)}
                anomalies={anomalies}
                apiKey={apiKey}
              />
            )}
          </div>
          
          <div className="space-y-4">
            <RealisticAttackSimulation 
              rsus={rsus}
              anomalies={anomalies}
              isLiveMonitoring={isLiveMonitoring}
              setRsus={setRsus}
              setAnomalies={setAnomalies}
            />
            
            {modelsLoaded && isLiveMonitoring && (
              <div className="flex flex-col text-xs text-muted-foreground">
                <span>ML Model Update in: {mlUpdateCountdown}s</span>
                <span>Active Backend: {loadModelsByType ? "WebGL" : "CPU"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render logic
  if (initialLoading && isLoading) {
    return renderLoadingSkeleton();
  }

  // Ensure we have an API key before attempting to load the map
  if (!keyIsSet) {
    return renderApiKeyNeeded();
  }

  if (loadError) {
    return renderLoadingError();
  }

  if (!isLoaded || !keyIsSet) {
    return renderLoadingMaps();
  }

  return renderMap();
};

export default TrafficMap;
