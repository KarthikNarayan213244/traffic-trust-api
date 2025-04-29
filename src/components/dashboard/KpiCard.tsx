
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
  icon?: LucideIcon;
  color?: "primary" | "accent" | "danger" | "success" | "warning" | "info";
  trend?: {
    value: string;
    label: string;
    direction?: "up" | "down" | "neutral";
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
  const [displayValue, setDisplayValue] = useState<string | number>(0);
  const previousValue = useRef<number>(0);
  const interval = useRef<NodeJS.Timeout | null>(null);

  // Color variants for different types of KPI cards
  const colorVariants = {
    primary: {
      bg: "from-blue-500/10 to-indigo-500/5",
      icon: "bg-blue-500/10 text-blue-700",
      text: "text-blue-700",
      ring: "ring-blue-500/30",
      trend: {
        up: "text-green-600",
        down: "text-red-600",
        neutral: "text-gray-600"
      }
    },
    accent: {
      bg: "from-amber-500/10 to-yellow-500/5",
      icon: "bg-amber-500/10 text-amber-700",
      text: "text-amber-700",
      ring: "ring-amber-500/30",
      trend: {
        up: "text-green-600",
        down: "text-red-600",
        neutral: "text-gray-600"
      }
    },
    danger: {
      bg: "from-red-500/10 to-rose-500/5",
      icon: "bg-red-500/10 text-red-600",
      text: "text-red-600",
      ring: "ring-red-500/30",
      trend: {
        up: "text-red-600",
        down: "text-green-600",
        neutral: "text-gray-600"
      }
    },
    success: {
      bg: "from-green-500/10 to-emerald-500/5",
      icon: "bg-green-500/10 text-green-700",
      text: "text-green-700",
      ring: "ring-green-500/30",
      trend: {
        up: "text-green-600",
        down: "text-red-600",
        neutral: "text-gray-600"
      }
    },
    warning: {
      bg: "from-yellow-500/10 to-orange-500/5",
      icon: "bg-yellow-500/10 text-yellow-700",
      text: "text-yellow-700",
      ring: "ring-yellow-500/30",
      trend: {
        up: "text-amber-600",
        down: "text-red-600",
        neutral: "text-gray-600"
      }
    },
    info: {
      bg: "from-cyan-500/10 to-sky-500/5",
      icon: "bg-cyan-500/10 text-cyan-700",
      text: "text-cyan-700",
      ring: "ring-cyan-500/30",
      trend: {
        up: "text-cyan-600",
        down: "text-red-600",
        neutral: "text-gray-600"
      }
    },
  };
  
  const variant = colorVariants[color];

  // Animated counter effect
  useEffect(() => {
    if (isLoading || typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    // Clear previous interval if it exists
    if (interval.current) {
      clearInterval(interval.current);
    }

    const startValue = previousValue.current || 0;
    const endValue = value;
    const duration = 1000; // ms
    const stepTime = 20; // ms
    const steps = duration / stepTime;
    const increment = (endValue - startValue) / steps;
    let currentStep = 0;
    let currentValue = startValue;

    interval.current = setInterval(() => {
      currentStep++;
      currentValue += increment;
      
      if (currentStep >= steps) {
        clearInterval(interval.current!);
        setDisplayValue(endValue);
        previousValue.current = endValue;
      } else {
        setDisplayValue(Math.floor(currentValue));
      }
    }, stepTime);

    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [value, isLoading]);

  // Format the display value
  const formattedValue = typeof displayValue === 'number' && displayValue > 999 
    ? displayValue.toLocaleString() 
    : displayValue;

  return (
    <Card className={cn(
      "overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 group",
      "bg-gradient-to-br", 
      variant.bg
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1"></Skeleton>
            ) : (
              <div>
                <p className={cn(`text-2xl font-bold transition-all duration-300 group-hover:scale-105`, variant.text)}>
                  {formattedValue}
                  {total && <span className="text-sm font-normal text-gray-500 ml-1">/ {total.toLocaleString()}</span>}
                </p>
                
                {trend && (
                  <div className={cn("flex items-center mt-1 text-xs", 
                    trend.direction 
                      ? variant.trend[trend.direction] 
                      : variant.trend.neutral
                  )}>
                    {trend.direction === 'up' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>}
                    {trend.direction === 'down' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
                    <span>{trend.value}</span>
                    <span className="text-gray-500 ml-1">{trend.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "p-3 rounded-full transition-transform duration-300 group-hover:scale-110 ring-1", 
              variant.icon,
              variant.ring
            )}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
