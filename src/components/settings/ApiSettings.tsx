
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

interface ApiSettingsProps {
  onSave?: (config: {baseUrl: string, useMock: boolean}) => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ onSave }) => {
  const [baseUrl, setBaseUrl] = useState("http://localhost:5000");
  const [useMock, setUseMock] = useState(true);

  const handleSave = () => {
    // Save settings to local storage for persistence
    localStorage.setItem('api_base_url', baseUrl);
    localStorage.setItem('use_mock_data', String(useMock));
    
    // Notify parent component
    if (onSave) {
      onSave({ baseUrl, useMock });
    }
    
    toast({
      title: "API Settings Saved",
      description: `API URL set to ${baseUrl}. ${useMock ? 'Using mock data.' : 'Using real API data.'}`,
    });
    
    // Force page reload to apply new settings
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>Configure your Hyderabad Traffic Trust Platform API settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-url">API Base URL</Label>
          <Input 
            id="api-url" 
            value={baseUrl} 
            onChange={(e) => setBaseUrl(e.target.value)} 
            placeholder="https://your-api-endpoint.com"
          />
          <p className="text-sm text-muted-foreground">
            Enter the base URL for your API endpoints (e.g., http://localhost:5000)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="use-mock" 
            checked={useMock} 
            onCheckedChange={setUseMock} 
          />
          <Label htmlFor="use-mock">Use mock data when API is unavailable</Label>
        </div>
        
        <Button onClick={handleSave} className="w-full">
          Save API Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default ApiSettings;
