
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import ApiSettings from "@/components/settings/ApiSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <Tabs defaultValue="api" className="w-full">
          <TabsList>
            <TabsTrigger value="api">API Configuration</TabsTrigger>
            <TabsTrigger value="map">Map Settings</TabsTrigger>
            <TabsTrigger value="display">Display Options</TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="mt-4">
            <ApiSettings />
          </TabsContent>
          <TabsContent value="map" className="mt-4">
            <div className="p-8 text-center text-muted-foreground">
              Map configuration options coming soon
            </div>
          </TabsContent>
          <TabsContent value="display" className="mt-4">
            <div className="p-8 text-center text-muted-foreground">
              Display options coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
