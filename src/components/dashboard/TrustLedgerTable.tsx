
import React, { useEffect, useState } from "react";
import { fetchData, getMockData, TrustLedgerEntry } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrustLedgerTableProps {
  dataEndpoint: string;
}

const TrustLedgerTable: React.FC<TrustLedgerTableProps> = ({ dataEndpoint }) => {
  const [data, setData] = useState<TrustLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Use mock data for development
        const responseData = getMockData(dataEndpoint) as TrustLedgerEntry[];
        
        if (Array.isArray(responseData)) {
          // Sort by timestamp descending (most recent first)
          const sortedData = [...responseData].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          setData(sortedData);
        }
      } catch (error) {
        console.error(`Error loading trust ledger data:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dataEndpoint]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  // Get badge color based on trust score change
  const getTrustBadge = (oldValue: number, newValue: number) => {
    const difference = newValue - oldValue;
    if (difference > 0) {
      return <Badge className="bg-green-500">+{difference}</Badge>;
    } else if (difference < 0) {
      return <Badge className="bg-danger">{difference}</Badge>;
    } else {
      return <Badge className="bg-gray-400">0</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trust Ledger</CardTitle>
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
                      {getTrustBadge(entry.old_value, entry.new_value)}
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

export default TrustLedgerTable;
