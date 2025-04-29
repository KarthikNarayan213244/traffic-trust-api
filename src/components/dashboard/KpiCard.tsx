
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
  icon?: LucideIcon;
  color?: string;
  trend?: {
    value: string;
    label: string;
  };
  total?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  isLoading = false,
  icon: Icon,
  color = "primary",
  trend,
  total,
}) => {
  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    danger: "text-red-500",
  };

  const bgColorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    danger: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-opacity-50 hover:border-opacity-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 mt-1"></Skeleton>
                <Skeleton className="h-3.5 w-24 mt-1"></Skeleton>
              </div>
            ) : (
              <div>
                <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} transition-all duration-500`}>
                  {value}
                  {total && <span className="text-sm font-normal text-gray-500 ml-1">/ {total}</span>}
                </p>
                
                {trend && (
                  <div className="flex items-center mt-1 text-xs">
                    <span className={
                      trend.value.includes('+') 
                        ? 'text-emerald-600' 
                        : trend.value.includes('-') 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                    }>
                      {trend.value}
                    </span>
                    <span className="text-gray-500 ml-1">{trend.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${bgColorClasses[color as keyof typeof bgColorClasses]} transition-transform group-hover:scale-110`}>
              <Icon size={24} className="transition-all duration-300" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
