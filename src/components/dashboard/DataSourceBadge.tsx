
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataSourceBadgeProps {
  provider: string;
  isRealTime: boolean;
  apiCredits?: number | string; // Updated to accept both number and string
}

const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  provider,
  isRealTime,
  apiCredits
}) => {
  const badgeVariant = isRealTime ? "default" : "secondary";
  const badgeClass = isRealTime ? "bg-blue-600 hover:bg-blue-700" : "";
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center space-x-1">
            <Badge variant={badgeVariant} className={`${badgeClass} ${isRealTime ? 'animate-pulse' : ''}`}>
              {isRealTime ? "LIVE API" : "SIMULATED"}
            </Badge>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p><strong>Data Source:</strong> {provider}</p>
            <p><strong>Type:</strong> {isRealTime ? "Real-time API data" : "Simulated data"}</p>
            {apiCredits && <p className="text-muted-foreground">{apiCredits.toString()}</p>}
            {!isRealTime && (
              <p className="text-amber-500">
                To enable real-time data, add an API key for a supported traffic provider in your environment variables.
              </p>
            )}
            {isRealTime && (
              <p className="text-green-500">
                Using live traffic data from external API provider. No fallback to simulated data.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DataSourceBadge;
