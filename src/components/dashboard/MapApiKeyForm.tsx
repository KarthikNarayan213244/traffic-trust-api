
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
import { API_KEY_STORAGE_KEY } from "./map/constants";
import { Loader2 } from "lucide-react";

interface MapApiKeyFormProps {
  onApiKeySet: (apiKey: string) => void;
  initialOpen?: boolean;
  keyLoading?: boolean;
}

const MapApiKeyForm: React.FC<MapApiKeyFormProps> = ({ 
  onApiKeySet, 
  initialOpen = false, 
  keyLoading = false 
}) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Check if API key exists in localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    
    // Only open dialog automatically if no API key is found and initialOpen is true
    if (!storedApiKey && initialOpen) {
      setShowDialog(true);
    }
    
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, [initialOpen]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setIsSaving(true);
      onApiKeySet(apiKey.trim());
      setShowDialog(false);
      
      // The toast will now be handled in the useMapApiKey hook
      
      setTimeout(() => setIsSaving(false), 300);
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
        onClick={handleUpdateApiKey}
        disabled={keyLoading}
      >
        {keyLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Maps API Key...
          </>
        ) : (
          "Update Maps API Key"
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={(open) => !isSaving && setShowDialog(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Google Maps API Key</DialogTitle>
            <DialogDescription>
              Enter your Google Maps API key to enable the traffic map functionality. 
              The key will be stored in your browser's local storage for future sessions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Enter your Google Maps API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              disabled={isSaving}
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
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MapApiKeyForm;
