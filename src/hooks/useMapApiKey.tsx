
import { useState, useCallback, useEffect, useRef } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";
import { toast } from "@/hooks/use-toast";

// Create a module-level variable to track if a page reload is in progress
let isReloading = false;

export const useMapApiKey = () => {
  // Maintain a ref to detect if this is the first render
  const isFirstRender = useRef(true);
  
  // Always try to get the key from environment first, then localStorage
  const getStoredKey = (): string => {
    try {
      // First try to get from environment variable
      const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      
      // If not available, try localStorage as fallback
      if (!envKey) {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
        if (storedKey) {
          console.log("Loaded Maps API key from localStorage");
          return storedKey;
        }
      } else {
        console.log("Using Maps API key from environment variable");
        return envKey;
      }
    } catch (error) {
      console.error("Error reading Maps API key:", error);
    }
    return "";
  };

  // Initialize state with stored key
  const [apiKey, setApiKey] = useState<string>(getStoredKey);
  const [keyIsSet, setKeyIsSet] = useState<boolean>(!!getStoredKey());

  const handleApiKeySet = useCallback((newApiKey: string) => {
    // Check if we're already reloading to prevent double toasts/actions
    if (isReloading) return;
    
    if (newApiKey !== apiKey) {
      try {
        // Update localStorage
        localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
        console.log("Saved new Maps API key to localStorage");
        
        // Update state
        setApiKey(newApiKey);
        setKeyIsSet(!!newApiKey);
        
        // Only force reload if we're past initial render and key is changing
        // This prevents the Maps API from being loaded twice with different keys
        if (!isFirstRender.current && apiKey) {
          isReloading = true;
          
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

  // After first render, update flag
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return { apiKey, handleApiKeySet, keyIsSet };
};
