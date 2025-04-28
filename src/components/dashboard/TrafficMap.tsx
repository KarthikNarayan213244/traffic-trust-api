
import React, { useState, useCallback, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapApiKeyForm from "./MapApiKeyForm";
import GoogleMapDisplay from "./map/GoogleMapDisplay";
import { API_KEY_STORAGE_KEY, libraries } from "./map/constants";
import { fetchVehicles, fetchRSUs, fetchCongestionData, Vehicle } from "@/services/api";
import { Button } from "@/components/ui/button";
import { AlertCircle, Play, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  // State for Google Maps API key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  });
  
  // State for data
  const [vehicles, setVehicles] = useState<any[]>(initialVehicles);
  const [rsus, setRsus] = useState<any[]>(initialRsus);
  const [congestionData, setCongestionData] = useState<any[]>(initialCongestionData);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  
  // Simulation controls
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Vehicle | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);

  // Setup Google Maps JS API loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Handle API key update
  const handleApiKeySet = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    // Force reload the page to re-initialize the Google Maps API with the new key
    if (newApiKey !== apiKey) {
      window.location.reload();
    }
  }, [apiKey]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch vehicles data
      const vehiclesData = await fetchVehicles();
      setVehicles(vehiclesData);
      
      // Fetch RSUs data
      const rsusData = await fetchRSUs();
      setRsus(rsusData);
      
      // Fetch congestion data
      const congestionData = await fetchCongestionData();
      setCongestionData(congestionData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "Could not fetch traffic data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up interval for data updates when simulation is running
  useEffect(() => {
    if (!isSimulationRunning) return;

    const vehicleInterval = setInterval(() => {
      fetchVehicles().then(data => {
        setVehicles(data);
      }).catch(error => {
        console.error("Error updating vehicles:", error);
      });
    }, 5000); // Update vehicles every 5 seconds

    const congestionInterval = setInterval(() => {
      fetchCongestionData().then(data => {
        setCongestionData(data);
      }).catch(error => {
        console.error("Error updating congestion data:", error);
      });
    }, 60000); // Update congestion every minute

    return () => {
      clearInterval(vehicleInterval);
      clearInterval(congestionInterval);
    };
  }, [isSimulationRunning]);

  // Toggle simulation
  const toggleSimulation = () => {
    setIsSimulationRunning(prev => !prev);
    toast({
      title: !isSimulationRunning ? "Simulation Started" : "Simulation Paused",
      description: !isSimulationRunning ? 
        "Live data updates enabled. Vehicles update every 5 seconds, congestion every minute." : 
        "Data updates paused.",
    });
  };

  // Handle ambulance selection for routing
  const handleAmbulanceSelect = (ambulance: Vehicle) => {
    setSelectedAmbulance(ambulance);
    toast({
      title: "Ambulance Selected",
      description: "Click on the map to set a destination for route optimization.",
    });
  };

  // Handle destination selection for routing
  const handleDestinationSelect = (latLng: google.maps.LatLngLiteral) => {
    if (selectedAmbulance) {
      setDestination(latLng);
    }
  };

  // Reset routing
  const resetRouting = () => {
    setSelectedAmbulance(null);
    setDestination(null);
  };

  // Show loading spinner
  if (initialLoading && isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show API key form if no key is set
  if (!apiKey) {
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

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button 
            onClick={toggleSimulation}
            variant="outline"
            className={isSimulationRunning ? "bg-red-100" : "bg-green-100"}
          >
            {isSimulationRunning ? (
              <><Pause className="mr-1" size={16} /> Pause Simulation</>
            ) : (
              <><Play className="mr-1" size={16} /> Start Simulation</>
            )}
          </Button>
          
          {selectedAmbulance && (
            <Button variant="outline" onClick={resetRouting} className="bg-blue-100">
              Cancel Route Planning
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!apiKey && (
            <p className="text-sm text-yellow-600 flex items-center">
              <AlertCircle className="mr-1" size={16} /> 
              Maps API key required
            </p>
          )}
          <MapApiKeyForm onApiKeySet={handleApiKeySet} />
        </div>
      </div>

      <GoogleMapDisplay 
        vehicles={vehicles} 
        rsus={rsus} 
        congestionData={congestionData} 
        isSimulationRunning={isSimulationRunning}
        selectedAmbulance={selectedAmbulance}
        onAmbulanceSelect={handleAmbulanceSelect}
        destination={destination}
        onMapClick={handleDestinationSelect}
      />
    </div>
  );
};

export default TrafficMap;
