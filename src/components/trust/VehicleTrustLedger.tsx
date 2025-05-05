
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface VehicleTrustLedgerProps {
  data?: any[];
  isLoading?: boolean;
}

const VehicleTrustLedger: React.FC<VehicleTrustLedgerProps> = ({
  data = [],
  isLoading = false,
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Invalid timestamp:", timestamp);
      return "Invalid date";
    }
  };

  // Get action badge
  const getActionBadge = (action: string) => {
    const normalizedAction = action?.toUpperCase() || '';
    
    if (normalizedAction.includes('REWARD') || normalizedAction.includes('TRUST') && !normalizedAction.includes('DECREASE')) {
      return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle size={12} /> {action}</Badge>;
    } else if (normalizedAction.includes('PENALIZE') || normalizedAction.includes('VIOLATION') || normalizedAction.includes('DECREASE')) {
      return <Badge className="bg-amber-500 flex items-center gap-1"><AlertTriangle size={12} /> {action}</Badge>;
    } else {
      return <Badge>{action}</Badge>;
    }
  };

  // Get badge color based on trust score change
  const getTrustBadge = (oldTrust: number, newTrust: number) => {
    const difference = newTrust - oldTrust;
    
    if (difference > 0) {
      return (
        <Badge className="bg-green-500 flex items-center gap-1">
          <TrendingUp size={12} /> +{difference}
        </Badge>
      );
    } else if (difference < 0) {
      return (
        <Badge className="bg-red-500 flex items-center gap-1">
          <TrendingDown size={12} /> {difference}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-400">
          0
        </Badge>
      );
    }
  };

  // Sort by timestamp descending (most recent first)
  const sortedData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      try {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } catch (error) {
        return 0;
      }
    });
  }, [data]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Trust Change</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // No data state
  if (sortedData.length === 0) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Trust Change</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                No vehicle trust ledger entries available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle ID</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Trust Change</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry, index) => (
            <TableRow key={entry.id || index}>
              <TableCell>{entry.vehicle_id}</TableCell>
              <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
              <TableCell>{getActionBadge(entry.action_type)}</TableCell>
              <TableCell>
                {getTrustBadge(entry.old_trust, entry.new_trust)}
              </TableCell>
              <TableCell className="max-w-xs truncate">{entry.details || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VehicleTrustLedger;
