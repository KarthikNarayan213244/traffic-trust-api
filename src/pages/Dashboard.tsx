
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import KpiCard from "@/components/dashboard/KpiCard";
import TrafficMap from "@/components/dashboard/TrafficMap";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Radio, AlertTriangle, Shield } from "lucide-react";

const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hyderabad Traffic Trust Platform</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">BETA</span>
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          </div>
        </div>
        
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
        
        <Card>
          <CardHeader>
            <CardTitle>Real-time Traffic Monitoring</CardTitle>
            <CardDescription>View and track vehicles and roadside units across Hyderabad in real-time</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TrafficMap 
              vehiclesEndpoint="vehicles" 
              rsuEndpoint="rsus" 
              congestionZonesEndpoint="congestion"
            />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Anomaly Distribution</CardTitle>
              <CardDescription>Recent vehicle anomalies by severity</CardDescription>
            </CardHeader>
            <CardContent>
              <AnomalyChart dataEndpoint="anomalies" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Blockchain Trust Ledger</CardTitle>
              <CardDescription>Recent trust score changes secured by blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <TrustLedgerTable dataEndpoint="trustLedger" />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
