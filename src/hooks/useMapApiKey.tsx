
import { useState, useCallback, useEffect } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";
import { toast } from "@/hooks/use-toast";

// Global variable to track if we've already loaded the API
let googleMapsApiLoaded = false;
let initialApiKey: string | null = null;

// Initialize the API key only once when the module is loaded
if (initialApiKey === null) {
  try {
    initialApiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
    console.log("Loaded Maps API key from localStorage:", initialApiKey ? "Key found" : "No key found");
  } catch (error) {
    console.error("Error reading Maps API key from localStorage:", error);
    initialApiKey = "";
  }
}

export const useMapApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");
  
  // Handle changes to the API key
  useEffect(() => {
    // Update module-level variable if the key changes
    initialApiKey = apiKey;
  }, [apiKey]);

  const handleApiKeySet = useCallback((newApiKey: string) => {
    // Avoid unnecessary re-initializations by checking if the key is actually changing
    if (newApiKey !== apiKey) {
      try {
        localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
        console.log("Saved new Maps API key to localStorage");
        setApiKey(newApiKey);
        
        // Only force reload if we had a previous key and it's changing
        // This is critical because the Google Maps loader can't be called with different options
        if (googleMapsApiLoaded) {
          toast({
            title: "API Key Updated",
            description: "The Google Maps API key has been updated. Reloading the application.",
          });
          
          // Give the toast a moment to be seen
          setTimeout(() => {
            console.log("API key changed, reloading page");
            window.location.reload();
          }, 2000);
          return;
        }
      } catch (error) {
        console.error("Error saving Maps API key to localStorage:", error);
        toast({
          title: "Error Saving API Key",
          description: "There was an error saving the Maps API key. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [apiKey]);

  return { apiKey, handleApiKeySet };
};

// Function to mark that Google Maps API has been loaded
export const markGoogleMapsAsLoaded = () => {
  googleMapsApiLoaded = true;
};
