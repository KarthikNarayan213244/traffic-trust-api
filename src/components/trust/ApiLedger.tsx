
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApiLedgerProps {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const ApiLedger: React.FC<ApiLedgerProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Trust Ledger</CardTitle>
      </CardHeader>
      <CardContent>
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
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center space-y-4">
                      <p>Failed to load trust ledger entries</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onRetry}
                      >
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No trust ledger entries available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((entry) => (
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
                      {entry.old_value < entry.new_value ? (
                        <span className="text-green-500">+{entry.new_value - entry.old_value}</span>
                      ) : entry.old_value > entry.new_value ? (
                        <span className="text-red-500">{entry.new_value - entry.old_value}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiLedger;
