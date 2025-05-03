
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AnomalyChart from "@/components/dashboard/AnomalyChart";
import VehicleTrustCard from "@/components/dashboard/VehicleTrustCard";
import { BarChart3 } from "lucide-react";

interface ChartsRowProps {
  anomalies: any[];
  vehicles: any[];
  isLoading: boolean;
}

const ChartsRow: React.FC<ChartsRowProps> = ({
  anomalies,
  vehicles,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Anomaly Distribution</span>
          </CardTitle>
          <CardDescription>Recent vehicle anomalies by severity</CardDescription>
        </CardHeader>
        <CardContent>
          <AnomalyChart 
            data={anomalies} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
      
      <VehicleTrustCard vehicles={vehicles} />
    </div>
  );
};

export default ChartsRow;
