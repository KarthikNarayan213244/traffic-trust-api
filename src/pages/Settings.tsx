
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import ApiSettings from "@/components/settings/ApiSettings";
import EnvConfig from "@/components/settings/EnvConfig";

const Settings: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <EnvConfig />
        
        <ApiSettings />
      </div>
    </MainLayout>
  );
};

export default Settings;
