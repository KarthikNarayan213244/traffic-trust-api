
import { useState, useCallback, useEffect } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";
import { toast } from "@/hooks/use-toast";

// Use a singleton pattern to ensure the API key is only loaded once per app session
let initialApiKey: string | null = null;
let isInitialLoad = true;
let keyIsSet = false;

// Initialize the API key only once when the module is loaded
if (initialApiKey === null) {
  try {
    // First try to get from environment variable
    initialApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    
    // If not available, try localStorage as fallback
    if (!initialApiKey) {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
      if (storedKey) {
        initialApiKey = storedKey;
        console.log("Loaded Maps API key from localStorage:", initialApiKey ? "Key found" : "No key found");
      }
    } else {
      console.log("Using Maps API key from environment variable");
    }
    
    // Set our keyIsSet flag based on whether we have a valid key
    keyIsSet = !!initialApiKey;
  } catch (error) {
    console.error("Error reading Maps API key:", error);
    initialApiKey = "";
  }
}

export const useMapApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");

  const handleApiKeySet = useCallback((newApiKey: string) => {
    // Avoid unnecessary re-initializations by checking if the key is actually changing
    if (newApiKey !== apiKey) {
      try {
        // Update localStorage
        localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
        console.log("Saved new Maps API key to localStorage");
        
        // Update our module-level singleton
        initialApiKey = newApiKey;
        keyIsSet = !!newApiKey;
        
        // Update state
        setApiKey(newApiKey);
        
        // Only force reload if we're past initial load and key is changing
        if (!isInitialLoad) {
          toast({
            title: "API Key Updated",
            description: "The Google Maps API key has been updated. Reloading the application.",
          });
          
          // Give the toast a moment to be seen
          setTimeout(() => {
            console.log("API key changed, reloading page to prevent initialization conflicts");
            window.location.reload();
          }, 2000);
        }
        
        // After first render, we're no longer in initial load
        isInitialLoad = false;
      } catch (error) {
        console.error("Error saving Maps API key to localStorage:", error);
        toast({
          title: "Error Saving API Key",
          description: "There was an error saving the Maps API key. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // After first render, we're no longer in initial load even if the key didn't change
      isInitialLoad = false;
    }
  }, [apiKey]);

  // After first render, we're no longer in initial load
  useEffect(() => {
    isInitialLoad = false;
  }, []);

  // Export both the apiKey and whether it's been properly set
  return { apiKey, handleApiKeySet, keyIsSet };
};
