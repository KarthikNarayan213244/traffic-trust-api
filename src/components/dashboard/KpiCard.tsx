
import React, { useEffect, useState } from "react";
import { fetchData, getMockData } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  dataEndpoint: string;
  displayField?: string;
  icon?: LucideIcon;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  dataEndpoint,
  displayField = "length",
  icon: Icon,
  color = "primary",
}) => {
  const [value, setValue] = useState<number | string>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Use mock data for development
        const data = getMockData(dataEndpoint);
        
        // In production, use actual API
        // const data = await fetchData(dataEndpoint as any);
        
        if (displayField === "length" && Array.isArray(data)) {
          setValue(data.length);
        } else if (data && typeof data === "object" && displayField in data) {
          setValue(data[displayField]);
        }
      } catch (error) {
        console.error(`Error loading KPI data for ${title}:`, error);
        setValue("N/A");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dataEndpoint, displayField, title]);

  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    danger: "text-danger",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}>
                {value}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${color === 'primary' ? 'bg-primary/10 text-primary' : color === 'accent' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
