
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const API_KEY_STORAGE_KEY = "traffic_management_maps_api_key";

interface MapApiKeyFormProps {
  onApiKeySet: (apiKey: string) => void;
}

const MapApiKeyForm: React.FC<MapApiKeyFormProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showDialog, setShowDialog] = useState<boolean>(false);
  
  // Check if API key exists in localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      onApiKeySet(storedApiKey);
    } else {
      setShowDialog(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      onApiKeySet(apiKey.trim());
      setShowDialog(false);
      toast({
        title: "API Key Saved",
        description: "Google Maps is now ready to use.",
      });
    } else {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Google Maps API key.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateApiKey = () => {
    setShowDialog(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-3 left-3 z-10 bg-white/90"
        onClick={handleUpdateApiKey}
      >
        Update Maps API Key
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Maps API Key</DialogTitle>
            <DialogDescription>
              Enter your Google Maps API key to enable the traffic map functionality. 
              The key will be stored in your browser's local storage.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Enter your Google Maps API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
            />
            <p className="mt-2 text-xs text-gray-500">
              You can get an API key from the{" "}
              <a 
                href="https://console.cloud.google.com/google/maps-apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Google Cloud Console
              </a>.
              Make sure to enable Maps JavaScript API and Visualization API.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>Save API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapApiKeyForm;
