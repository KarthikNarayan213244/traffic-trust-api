
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

interface TrustLedgerTableProps {
  data?: any[];
  isLoading?: boolean;
  etherscanUrl?: string;
}

const TrustLedgerTable: React.FC<TrustLedgerTableProps> = ({
  data = [],
  isLoading = false,
  etherscanUrl
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

  // Get badge color based on trust score change
  const getTrustBadge = (oldValue: number, newValue: number) => {
    const difference = newValue - oldValue;
    if (difference > 0) {
      return <Badge className="bg-green-500">+{difference}</Badge>;
    } else if (difference < 0) {
      return <Badge className="bg-red-500">{difference}</Badge>;
    } else {
      return <Badge className="bg-gray-400">0</Badge>;
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
              <TableHead>Transaction ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Trust Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
              <TableHead>Transaction ID</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Trust Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                No trust ledger entries available
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
            <TableHead>Transaction ID</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Trust Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry) => (
            <TableRow key={entry.tx_id}>
              <TableCell className="font-mono text-xs">
                {entry.tx_id}
              </TableCell>
              <TableCell>
                {formatTimestamp(entry.timestamp)}
              </TableCell>
              <TableCell>{entry.vehicle_id}</TableCell>
              <TableCell>{entry.action}</TableCell>
              <TableCell>
                {entry.old_value !== undefined && entry.new_value !== undefined ? (
                  getTrustBadge(entry.old_value, entry.new_value)
                ) : entry.amount ? (
                  <Badge className="bg-blue-500">{entry.amount}</Badge>
                ) : (
                  <span>—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TrustLedgerTable;
