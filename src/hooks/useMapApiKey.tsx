
import { useState, useCallback, useEffect } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";

// Use a constant to store the initial API key value to avoid multiple initializations
let initialApiKey: string | null = null;

// Initialize the API key only once when the module is loaded
if (initialApiKey === null) {
  // Try to get the API key from multiple sources in order of preference:
  // 1. Environment variable (most secure)
  // 2. Local storage (for persistence across sessions)
  initialApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 
                 localStorage.getItem(API_KEY_STORAGE_KEY) || 
                 "";
}

export const useMapApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");

  // Update API key and store it for future use
  const handleApiKeySet = useCallback((newApiKey: string) => {
    // Avoid unnecessary re-initializations by checking if the key is actually changing
    if (newApiKey !== apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
      setApiKey(newApiKey);
      initialApiKey = newApiKey; // Keep the module-level variable in sync
      
      // Only force reload if we had a previous key and it's changing
      if (apiKey && newApiKey !== apiKey) {
        console.log("API key changed, reloading page");
        window.location.reload();
      }
    }
  }, [apiKey]);

  return { apiKey, handleApiKeySet };
};
