
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import DataTable from "@/components/dashboard/DataTable";
import AnomalyChart from "@/components/dashboard/AnomalyChart";

const Anomalies: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Anomalies</h1>
        
        <AnomalyChart dataEndpoint="anomalies" />
        
        <DataTable 
          columns={["id", "timestamp", "type", "severity", "vehicle_id"]}
          dataEndpoint="anomalies" 
          title="Detected Anomalies"
        />
      </div>
    </MainLayout>
  );
};

export default Anomalies;
