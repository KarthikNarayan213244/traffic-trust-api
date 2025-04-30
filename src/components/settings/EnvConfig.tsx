
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { API_KEY_STORAGE_KEY } from "@/components/dashboard/map/constants";
import { useMapApiKey } from "@/hooks/useMapApiKey";

// Define environment variable keys for our app
const ENV_KEYS = {
  API_URL: 'VITE_API_URL',
  RPC_URL: 'VITE_RPC_URL',
  CONTRACT_ADDRESS: 'VITE_CONTRACT_ADDRESS',
  GOOGLE_MAPS_API_KEY: 'VITE_GOOGLE_MAPS_API_KEY'
};

// Retrieve values from localStorage if they exist
const getStoredValue = (key: string) => {
  if (key === ENV_KEYS.GOOGLE_MAPS_API_KEY) {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  }
  return localStorage.getItem(`env_${key}`) || '';
};

const EnvConfig: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(getStoredValue(ENV_KEYS.API_URL) || 'http://localhost:5000');
  const [rpcUrl, setRpcUrl] = useState(getStoredValue(ENV_KEYS.RPC_URL) || 'https://eth-goerli.public.blastapi.io');
  const [contractAddress, setContractAddress] = useState(getStoredValue(ENV_KEYS.CONTRACT_ADDRESS) || '');
  const [mapsApiKey, setMapsApiKey] = useState(getStoredValue(ENV_KEYS.GOOGLE_MAPS_API_KEY) || '');
  const [isSaving, setIsSaving] = useState(false);
  const { handleApiKeySet } = useMapApiKey();

  // Save values to localStorage and notify user
  const handleSave = () => {
    setIsSaving(true);
    
    try {
      // Store values in localStorage
      localStorage.setItem(`env_${ENV_KEYS.API_URL}`, apiUrl);
      localStorage.setItem(`env_${ENV_KEYS.RPC_URL}`, rpcUrl);
      localStorage.setItem(`env_${ENV_KEYS.CONTRACT_ADDRESS}`, contractAddress);
      
      // Update the Maps API key using the same mechanism as the dialog
      if (mapsApiKey.trim()) {
        handleApiKeySet(mapsApiKey.trim());
      }
      
      // Inform the user about the reload requirement
      toast({
        title: "Configuration Saved",
        description: "Environment variables have been saved. Maps API key is applied immediately.",
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Populate form with environment variables on component mount
  useEffect(() => {
    // Use actual environment variables if available, otherwise use localStorage values
    setApiUrl(import.meta.env.VITE_API_URL || getStoredValue(ENV_KEYS.API_URL) || 'http://localhost:5000');
    setRpcUrl(import.meta.env.VITE_RPC_URL || getStoredValue(ENV_KEYS.RPC_URL) || 'https://eth-goerli.public.blastapi.io');
    setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS || getStoredValue(ENV_KEYS.CONTRACT_ADDRESS) || '');
    setMapsApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || getStoredValue(ENV_KEYS.GOOGLE_MAPS_API_KEY) || '');
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Configuration</CardTitle>
        <CardDescription>
          Configure connection endpoints for APIs and blockchain.
          These settings will be stored in your browser for development.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            placeholder="http://localhost:5000"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Backend API for traffic data</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rpcUrl">Blockchain RPC URL</Label>
          <Input
            id="rpcUrl"
            placeholder="https://eth-goerli.public.blastapi.io"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Ethereum RPC provider for the Goerli testnet</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contractAddress">Contract Address</Label>
          <Input
            id="contractAddress"
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Address of the TrustLedger smart contract</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mapsApiKey">Google Maps API Key</Label>
          <Input
            id="mapsApiKey"
            placeholder="Your Google Maps API Key"
            value={mapsApiKey}
            onChange={(e) => setMapsApiKey(e.target.value)}
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Required for map display. This will be used across the application.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnvConfig;
