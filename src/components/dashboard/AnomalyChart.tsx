
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnomalyChartProps {
  data?: any[];
  isLoading?: boolean;
}

interface AnomalyChartData {
  type: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
}

const AnomalyChart: React.FC<AnomalyChartProps> = ({ 
  data = [], 
  isLoading = false
}) => {
  const [chartData, setChartData] = useState<AnomalyChartData[]>([]);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      console.log("Processing anomaly data for chart:", data.length, "records");
      
      // Process data for the chart - group by type
      const aggregatedData = data.reduce((acc, anomaly) => {
        if (!anomaly.type) {
          console.warn("Anomaly missing type:", anomaly);
          return acc;
        }
        
        const existingType = acc.find((item) => item.type === anomaly.type);
        if (existingType) {
          existingType.count += 1;
          
          // Set color based on severity
          if (anomaly.severity === "Critical") {
            existingType.critical += 1;
          } else if (anomaly.severity === "High") {
            existingType.high += 1;
          } else {
            existingType.medium += 1;
          }
        } else {
          const newItem = {
            type: anomaly.type,
            count: 1,
            critical: anomaly.severity === "Critical" ? 1 : 0,
            high: anomaly.severity === "High" ? 1 : 0,
            medium: anomaly.severity !== "Critical" && anomaly.severity !== "High" ? 1 : 0,
          };
          acc.push(newItem);
        }
        return acc;
      }, [] as AnomalyChartData[]);
      
      console.log("Processed chart data:", aggregatedData);
      setChartData(aggregatedData);
    } else {
      console.log("No anomaly data available, or data not in expected format");
      setChartData([]);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-2 w-full">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-gray-500 border rounded-lg p-4">
          <div className="text-center">
            <p className="text-lg font-semibold">No anomaly data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable live updates or seed data to view anomaly statistics
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{fill: 'rgba(0, 0, 0, 0.05)'}} 
                contentStyle={{
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0'
                }}
              />
              <Legend />
              <Bar
                dataKey="critical"
                name="Critical"
                stackId="a"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
                animationBegin={300}
              />
              <Bar
                dataKey="high"
                name="High"
                stackId="a"
                fill="#FACC15"
                radius={[0, 0, 0, 0]}
                animationDuration={1500}
                animationBegin={300}
              />
              <Bar
                dataKey="medium"
                name="Medium"
                stackId="a"
                fill="#3B82F6"
                radius={[0, 0, 4, 4]}
                animationDuration={1500}
                animationBegin={300}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnomalyChart;
