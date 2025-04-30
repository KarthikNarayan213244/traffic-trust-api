
import { useState, useCallback, useEffect } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";

// Use a constant to store the initial API key value to avoid multiple initializations
let initialApiKey: string | null = null;

// Initialize the API key only once when the module is loaded
if (initialApiKey === null) {
  initialApiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

export const useMapApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");

  const handleApiKeySet = useCallback((newApiKey: string) => {
    // Avoid unnecessary re-initializations by checking if the key is actually changing
    if (newApiKey !== apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
      setApiKey(newApiKey);
      // Only force reload if we had a previous key and it's changing
      if (apiKey && newApiKey !== apiKey) {
        console.log("API key changed, reloading page");
        window.location.reload();
      }
    }
  }, [apiKey]);

  // Update module-level variable if the key changes
  useEffect(() => {
    initialApiKey = apiKey;
  }, [apiKey]);

  return { apiKey, handleApiKeySet };
};
