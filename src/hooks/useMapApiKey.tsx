
import { useState, useCallback, useEffect } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";
import { toast } from "@/hooks/use-toast";

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
  
  // Log for debugging
  console.log(`Map API key initialized: ${initialApiKey ? 'Found' : 'Not found'}`);
}

export const useMapApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");
  const [keyLoading, setKeyLoading] = useState(false);

  // Effect to handle initial setup
  useEffect(() => {
    // If we have an API key from env vars, make sure it's saved to localStorage too
    if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY && !localStorage.getItem(API_KEY_STORAGE_KEY)) {
      localStorage.setItem(API_KEY_STORAGE_KEY, import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string);
    }
  }, []);

  // Update API key and store it for future use
  const handleApiKeySet = useCallback((newApiKey: string) => {
    // Avoid unnecessary re-initializations by checking if the key is actually changing
    if (newApiKey !== apiKey) {
      setKeyLoading(true);
      
      localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
      setApiKey(newApiKey);
      initialApiKey = newApiKey; // Keep the module-level variable in sync
      
      // Log the key update
      console.log("Google Maps API key updated and saved to localStorage");
      
      // Show a toast notification
      toast({
        title: "Maps API Key Updated",
        description: "Your Google Maps API key has been saved for future sessions.",
      });
      
      // Only force reload if we had a previous key and it's changing
      if (apiKey && newApiKey !== apiKey) {
        console.log("API key changed, reloading page in 2 seconds");
        toast({
          title: "Reloading Application",
          description: "The page will reload to apply the new API key.",
        });
        
        // Add a small delay before reload to ensure localStorage is updated
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setKeyLoading(false);
      }
    }
  }, [apiKey]);

  return { apiKey, handleApiKeySet, keyLoading };
};
