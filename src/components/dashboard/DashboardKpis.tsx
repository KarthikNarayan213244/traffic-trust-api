
import React from "react";
import KpiCard from "@/components/dashboard/KpiCard";
import { Car, Radio, AlertTriangle, Shield } from "lucide-react";

interface DashboardKpisProps {
  counts: {
    totalVehicles: number;
    totalRSUs: number;
    vehicles: number;
  };
  rsus: any[];
  anomalies: any[];
  trustBlockchainData: any[];
  trustApiData: any[];
  isLoading: boolean;
  isBlockchainLoading: boolean;
}

const DashboardKpis: React.FC<DashboardKpisProps> = ({
  counts,
  rsus,
  anomalies,
  trustBlockchainData,
  trustApiData,
  isLoading,
  isBlockchainLoading
}) => {
  // Show critical anomalies count
  const criticalAnomalies = anomalies.filter(a => a.severity === "Critical").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard 
        title="Total Vehicles" 
        value={counts.totalVehicles || 0}
        isLoading={isLoading}
        icon={Car}
        trend={{
          value: "3.5M", // String value for trend
          label: "registered vehicles"
        }}
      />
      <KpiCard 
        title="Active RSUs" 
        value={rsus.filter(rsu => rsu.status === 'Active').length}
        total={counts.totalRSUs || 0}
        isLoading={isLoading}
        icon={Radio}
        color="accent"
      />
      <KpiCard 
        title="Recent Anomalies" 
        value={anomalies.length}
        isLoading={isLoading}
        icon={AlertTriangle}
        color="danger"
        trend={{
          value: criticalAnomalies > 0 ? 
            `${criticalAnomalies} critical` : 
            "0 critical",
          label: "issues detected"
        }}
      />
      <KpiCard 
        title="Trust Updates" 
        value={trustBlockchainData.length || trustApiData.length}
        isLoading={isBlockchainLoading}
        icon={Shield}
        trend={{
          value: "+15%", // String value for trend
          label: "increase in trust"
        }}
      />
    </div>
  );
};

export default DashboardKpis;
