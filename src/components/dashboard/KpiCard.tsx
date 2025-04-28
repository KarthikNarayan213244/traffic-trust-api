
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
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  isLoading = false,
  icon: Icon,
  color = "primary",
}) => {
  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    danger: "text-red-500",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1"></Skeleton>
            ) : (
              <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}>
                {value}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${color === 'primary' ? 'bg-primary/10 text-primary' : color === 'accent' ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
