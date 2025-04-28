
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficMap from "@/components/dashboard/TrafficMap";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import { Car, Radio, AlertTriangle, Shield } from "lucide-react";

const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            title="Total Vehicles" 
            dataEndpoint="vehicles" 
            displayField="length" 
            icon={Car}
          />
          <KpiCard 
            title="Active RSUs" 
            dataEndpoint="rsus" 
            displayField="length" 
            icon={Radio}
            color="accent"
          />
          <KpiCard 
            title="Recent Anomalies" 
            dataEndpoint="anomalies" 
            displayField="length" 
            icon={AlertTriangle}
            color="danger"
          />
          <KpiCard 
            title="Trust Updates" 
            dataEndpoint="trustLedger" 
            displayField="length" 
            icon={Shield}
          />
        </div>
        
        <TrafficMap 
          vehiclesEndpoint="vehicles" 
          rsuEndpoint="rsus" 
          congestionZonesEndpoint="congestion"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnomalyChart dataEndpoint="anomalies" />
          <TrustLedgerTable dataEndpoint="trustLedger" />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
