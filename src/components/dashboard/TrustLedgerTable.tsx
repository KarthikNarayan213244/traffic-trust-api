
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

interface TrustLedgerTableProps {
  data?: any[];
  isLoading?: boolean;
}

const TrustLedgerTable: React.FC<TrustLedgerTableProps> = ({
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
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              </TableCell>
            </TableRow>
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                No trust ledger entries available
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((entry) => (
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
                  {entry.old_value && entry.new_value ? (
                    getTrustBadge(entry.old_value, entry.new_value)
                  ) : (
                    <span>—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TrustLedgerTable;
