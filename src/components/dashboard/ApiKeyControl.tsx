
import React from "react";
import { AlertCircle } from "lucide-react";
import MapApiKeyForm from "./MapApiKeyForm";

interface ApiKeyControlProps {
  apiKey: string;
  onApiKeySet: (newApiKey: string) => void;
}

const ApiKeyControl: React.FC<ApiKeyControlProps> = ({ apiKey, onApiKeySet }) => {
  const hasApiKey = !!apiKey;
  
  return (
    <div className="flex items-center space-x-2">
      {!hasApiKey && (
        <p className="text-sm text-yellow-600 flex items-center">
          <AlertCircle className="mr-1" size={16} /> 
          Maps API key required
        </p>
      )}
      <MapApiKeyForm onApiKeySet={onApiKeySet} />
    </div>
  );
};

export default ApiKeyControl;
