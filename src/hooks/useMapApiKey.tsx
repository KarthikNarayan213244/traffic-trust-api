
import { useState, useCallback, useEffect, useRef } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";
import { toast } from "@/hooks/use-toast";

// Create a module-level variable to store the API key across component instances
let globalApiKey: string | null = null;
// Track if the Maps API has been initialized
let apiInitialized = false;
// Track if we're in the process of reloading
let isReloading = false;
// Track if this is the first load
let firstLoadComplete = false;
// Store a loader ID to ensure consistency
let currentLoaderId: string = "google-map-script";

export const useMapApiKey = () => {
  // Maintain a ref to detect if this is the first render
  const isFirstRender = useRef(true);
  
  // Get the stored key, with preference for existing global key
  const getStoredKey = (): string => {
    // If we already have a global key, use it for consistency
    if (globalApiKey !== null) {
      return globalApiKey;
    }
    
    try {
      // First try to get from environment variable
      const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      
      // If available, set our global key
      if (envKey) {
        console.log("Using Maps API key from environment variable");
        globalApiKey = envKey;
        firstLoadComplete = true;
        return envKey;
      }
      
      // If not from env, try localStorage
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
      if (storedKey) {
        console.log("Loaded Maps API key from localStorage");
        globalApiKey = storedKey;
        firstLoadComplete = true;
        return storedKey;
      }
    } catch (error) {
      console.error("Error reading Maps API key:", error);
    }
    
    // No key found anywhere, set empty string to global key
    globalApiKey = "";
    return "";
  };

  // Initialize state with stored key
  const [apiKey, setApiKey] = useState<string>(getStoredKey);
  const [keyIsSet, setKeyIsSet] = useState<boolean>(!!getStoredKey());
  
  // Handle API key set
  const handleApiKeySet = useCallback((newApiKey: string) => {
    if (newApiKey === apiKey || isReloading) return;
    
    try {
      // If the API has already been initialized with a different key,
      // we need to reload the page to prevent conflicts
      if (apiInitialized && apiKey && newApiKey !== apiKey && globalApiKey !== newApiKey) {
        // Prevent multiple reloads
        if (isReloading) return;
        isReloading = true;
        
        toast({
          title: "API Key Updated",
          description: "The Google Maps API key has been updated. Reloading the application in 2 seconds.",
        });
        
        // Update global key and localStorage before reloading
        globalApiKey = newApiKey;
        localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
        
        // Give the toast a moment to be seen, then reload
        setTimeout(() => {
          console.log("API key changed, reloading page to prevent initialization conflicts");
          window.location.reload();
        }, 2000);
        return;
      }
      
      // Update global key first to ensure consistency
      globalApiKey = newApiKey;
      
      // Update localStorage
      localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
      console.log("Saved new Maps API key to localStorage");
      
      // Update state
      setApiKey(newApiKey);
      setKeyIsSet(!!newApiKey);
      
      // Mark as initialized if this is the first time setting it
      if (newApiKey && !apiInitialized) {
        apiInitialized = true;
        firstLoadComplete = true;
      }
    } catch (error) {
      console.error("Error saving Maps API key to localStorage:", error);
      toast({
        title: "Error Saving API Key",
        description: "There was an error saving the Maps API key. Please try again.",
        variant: "destructive",
      });
    }
  }, [apiKey]);

  // After first render, update flag
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Mark as initialized if we have a key on first render
      if (apiKey && !apiInitialized) {
        apiInitialized = true;
        firstLoadComplete = true;
      }
    }
  }, [apiKey]);

  // Return a consistent loader ID to prevent conflicts
  const getLoaderId = useCallback(() => currentLoaderId, []);

  // Return our API key state and an indicator of whether the first load is complete
  return { 
    apiKey: globalApiKey || apiKey, // Always return the global key for consistency
    handleApiKeySet, 
    keyIsSet: !!(globalApiKey || apiKey),
    isFirstLoadComplete: firstLoadComplete,
    getLoaderId
  };
};
