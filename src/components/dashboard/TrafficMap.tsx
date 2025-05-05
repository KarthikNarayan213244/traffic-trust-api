
import React, { useEffect, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { libraries } from "./map/constants";
import { Vehicle } from "@/services/api/types";
import { fetchVehicles, fetchCongestionData, fetchRSUs, fetchAnomalies } from "@/services/api";
import MLControls from "./MLControls";
import ApiKeyControl from "./ApiKeyControl";
import SmartTrafficSimulation from "./SmartTrafficSimulation";
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
  const { apiKey, handleApiKeySet, keyIsSet } = useMapApiKey();
  const { vehicles, rsus, congestionData, anomalies, isLoading, setVehicles, setRsus, setCongestionData, setAnomalies } = useMapData(
    initialVehicles, 
    initialRsus, 
    initialCongestionData, 
    initialLoading
  );
  
  const { 
    isLiveMonitoring, selectedAmbulance, destination, modelAccuracy, optimizedRoute,
    isModelLoading, modelsLoaded, modelLoadingProgress,
    toggleLiveMonitoring, handleAmbulanceSelect, handleDestinationSelect, resetRouting,
    changeModelAccuracy, getIntervals 
  } = useMLSimulation();
  
  const [mlUpdateCountdown, setMlUpdateCountdown] = useState<number>(0);
  const [mapsInitialized, setMapsInitialized] = useState<boolean>(false);

  // Only initialize the maps API if we have a key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "", // Ensure we always pass a string, never undefined
    libraries,
    id: "google-map-script",
  });

  // Update maps initialization status
  useEffect(() => {
    if (isLoaded && !mapsInitialized) {
      console.log("Google Maps API loaded successfully");
      setMapsInitialized(true);
    }
  }, [isLoaded, mapsInitialized]);

  // Show loading skeleton
  if (initialLoading && isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Show API key form if no key is set
  if (!keyIsSet) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 flex-col">
        <p className="text-lg mb-4">Google Maps API Key Required</p>
        <MapApiKeyForm onApiKeySet={handleApiKeySet} />
      </div>
    );
  }

  // Show error if Google Maps failed to load
  if (loadError) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <h3 className="text-lg font-medium text-red-600">Failed to load Google Maps</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please check your internet connection and API key, then try again
          </p>
          <MapApiKeyForm onApiKeySet={handleApiKeySet} />
        </div>
      </div>
    );
  }

  // Show message if Google Maps is not loaded yet
  if (!isLoaded) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3">Loading maps...</span>
      </div>
    );
  }

  // Set up interval for data updates and ML inference when monitoring is active
  useEffect(() => {
    if (!isLiveMonitoring || isModelLoading) return;

    const intervals = getIntervals();
    let vehicleInterval: NodeJS.Timeout;
    let congestionInterval: NodeJS.Timeout;
    let rsuInterval: NodeJS.Timeout;
    let rsuTrustInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
    let mlUpdateInterval: NodeJS.Timeout;
    
    // First update immediately on start
    if (modelsLoaded) {
      (async () => {
        try {
          // Update congestion data with ML predictions
          const updatedCongestion = await updateCongestionData(congestionData);
          setCongestionData(updatedCongestion);
          console.log(`Updated ${updatedCongestion.length} congestion data points with ML predictions`);
          
          // Process vehicles for anomalies
          const detectedAnomalies = await processVehiclesForAnomalies(vehicles);
          if (detectedAnomalies.length > 0) {
            setAnomalies(prev => [...detectedAnomalies, ...prev]);
            console.log(`Detected ${detectedAnomalies.length} new anomalies using ML`);
          }
          
          // Update vehicle trust scores
          const updatedVehicles = await updateTrustScores(vehicles, anomalies);
          setVehicles(updatedVehicles);
          console.log(`Updated trust scores for ${updatedVehicles.length} vehicles using ML`);
          
          // Update RSU trust scores
          const updatedRsus = await updateRsuTrustScores(rsus, anomalies);
          setRsus(updatedRsus);
          console.log(`Updated trust scores for ${updatedRsus.length} RSUs using ML`);
        } catch (error) {
          console.error("Error in initial ML update:", error);
        }
      })();
    }
    
    // Vehicle data update interval
    vehicleInterval = setInterval(() => {
      fetchVehicles({ limit: 1000 }).then(data => {
        if (Array.isArray(data)) {
          setVehicles(data);
          console.log(`Updated ${data.length} vehicles`);
          
          // If ML models are loaded, process vehicles for anomalies
          if (modelsLoaded) {
            processVehiclesForAnomalies(data).then(detectedAnomalies => {
              if (detectedAnomalies.length > 0) {
                setAnomalies(prev => [...detectedAnomalies, ...prev]);
                console.log(`Detected ${detectedAnomalies.length} new anomalies using ML`);
              }
            }).catch(error => {
              console.error("Error processing anomalies:", error);
            });
          }
        }
      }).catch(error => {
        console.error("Error updating vehicles:", error);
      });
    }, intervals.vehicles);

    // Congestion data update with ML prediction interval
    congestionInterval = setInterval(() => {
      fetchCongestionData({ limit: 500 }).then(async data => {
        if (Array.isArray(data)) {
          // If ML models are loaded, use them to update congestion predictions
          if (modelsLoaded) {
            try {
              const updatedCongestion = await updateCongestionData(data);
              setCongestionData(updatedCongestion);
              console.log(`Updated ${updatedCongestion.length} congestion data points with ML predictions`);
            } catch (error) {
              console.error("Error updating congestion with ML:", error);
              setCongestionData(data);
            }
          } else {
            setCongestionData(data);
            console.log(`Updated ${data.length} congestion data points`);
          }
        }
      }).catch(error => {
        console.error("Error updating congestion data:", error);
      });
    }, intervals.congestion);
    
    // RSU data update interval
    rsuInterval = setInterval(() => {
      fetchRSUs({ limit: 100 }).then(data => {
        if (Array.isArray(data)) {
          setRsus(data);
          console.log(`Updated ${data.length} RSUs`);
        }
      }).catch(error => {
        console.error("Error updating RSUs:", error);
      });
    }, intervals.rsus);
    
    // RSU trust update interval
    rsuTrustInterval = setInterval(() => {
      if (modelsLoaded) {
        // Update RSU trust scores
        updateRsuTrustScores(rsus, anomalies).then(updatedRsus => {
          setRsus(updatedRsus);
          console.log(`Updated trust scores for ${updatedRsus.length} RSUs using ML`);
        }).catch(error => {
          console.error("Error updating RSU trust scores:", error);
        });
      }
    }, intervals.rsus);
    
    // ML model update countdown
    countdownInterval = setInterval(() => {
      setMlUpdateCountdown(prev => {
        if (prev <= 0) {
          return Math.floor(intervals.modelUpdate / 1000);
        }
        return prev - 1;
      });
    }, 1000);
    
    // ML model update interval (more intensive analysis)
    mlUpdateInterval = setInterval(() => {
      if (modelsLoaded) {
        console.log("Running comprehensive ML model updates...");
        
        // Update trust scores based on all data
        updateTrustScores(vehicles, anomalies).then(updatedVehicles => {
          setVehicles(updatedVehicles);
          console.log(`Updated trust scores for ${updatedVehicles.length} vehicles using ML`);
        }).catch(error => {
          console.error("Error in ML model update:", error);
        });
        
        setMlUpdateCountdown(Math.floor(intervals.modelUpdate / 1000));
      }
    }, intervals.modelUpdate);

    return () => {
      clearInterval(vehicleInterval);
      clearInterval(congestionInterval);
      clearInterval(rsuInterval);
      clearInterval(rsuTrustInterval);
      clearInterval(mlUpdateInterval);
      clearInterval(countdownInterval);
    };
  }, [
    isLiveMonitoring, modelsLoaded, isModelLoading, 
    vehicles, rsus, congestionData, anomalies,
    setVehicles, setRsus, setCongestionData, setAnomalies,
    getIntervals
  ]);

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
          {/* Only render the GoogleMapDisplay when the Google Maps API is loaded */}
          {isLoaded && (
            <GoogleMapDisplay 
              vehicles={vehicles} 
              rsus={rsus} 
              congestionData={congestionData} 
              isLiveMonitoring={isLiveMonitoring}
              selectedAmbulance={selectedAmbulance}
              onAmbulanceSelect={handleAmbulanceSelect}
              destination={destination}
              optimizedRoute={optimizedRoute}
              onMapClick={(latLng) => handleDestinationSelect(latLng)}
              anomalies={anomalies}
              apiKey={apiKey}
            />
          )}
        </div>
        
        <div className="space-y-4">
          <SmartTrafficSimulation 
            rsus={rsus}
            anomalies={anomalies}
            isLiveMonitoring={isLiveMonitoring}
            setRsus={setRsus}
            setAnomalies={setAnomalies}
          />
          
          {modelsLoaded && isLiveMonitoring && (
            <div className="flex justify-end text-xs text-muted-foreground">
              <span>ML Model Update in: {mlUpdateCountdown}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficMap;
