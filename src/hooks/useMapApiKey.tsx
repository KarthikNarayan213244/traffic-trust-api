
import { useState, useCallback } from "react";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";

export const useMapApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  });

  const handleApiKeySet = useCallback((newApiKey: string) => {
    setApiKey(newApiKey);
    // Force reload the page to re-initialize the Google Maps API with the new key
    if (newApiKey !== apiKey) {
      window.location.reload();
    }
  }, [apiKey]);

  return { apiKey, handleApiKeySet };
};
