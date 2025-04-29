
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
import { Card } from "@/components/ui/card";

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
      // Process data for the chart - group by type
      const aggregatedData = data.reduce((acc, anomaly) => {
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
      
      setChartData(aggregatedData);
    } else {
      setChartData([]);
    }
  }, [data]);

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No anomaly data available
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="critical"
                name="Critical"
                stackId="a"
                fill="#EF4444"
              />
              <Bar
                dataKey="high"
                name="High"
                stackId="a"
                fill="#FACC15"
              />
              <Bar
                dataKey="medium"
                name="Medium"
                stackId="a"
                fill="#1D4ED8"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnomalyChart;
