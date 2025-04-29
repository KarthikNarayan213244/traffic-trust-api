
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BlockchainLedgerProps {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  etherscanUrl: string;
  onRetry: () => void;
  onStakeClick: () => void;
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({
  data,
  isLoading,
  isError,
  etherscanUrl,
  onRetry,
  onStakeClick,
}) => {
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
      console.error("Invalid timestamp format:", error);
      return "Invalid date";
    }
  };
  
  // Get badge color based on trust score change
  const getTrustBadge = (oldValue?: number, newValue?: number) => {
    if (!oldValue || !newValue) return null;
    
    const difference = newValue - oldValue;
    if (difference > 0) {
      return <Badge className="bg-green-500">+{difference}</Badge>;
    } else if (difference < 0) {
      return <Badge className="bg-red-500">{difference}</Badge>;
    } else {
      return <Badge className="bg-gray-400">0</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Blockchain Trust Ledger</CardTitle>
          <CardDescription>
            Trust attestations recorded on the blockchain
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onStakeClick}
        >
          Stake Trust
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Vehicle ID</TableHead>
                <TableHead>Staked Amount</TableHead>
                <TableHead>Timestamp</TableHead>
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
                      <p>Failed to load blockchain data</p>
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
                    <div className="flex flex-col items-center space-y-4">
                      <p>No blockchain trust entries yet</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={onStakeClick}
                      >
                        Simulate Stake
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((entry) => (
                  <TableRow key={entry.tx_id}>
                    <TableCell className="font-mono text-xs">
                      {entry.tx_id}
                    </TableCell>
                    <TableCell>{entry.vehicle_id}</TableCell>
                    <TableCell>{entry.amount}</TableCell>
                    <TableCell>
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      {getTrustBadge(entry.old_value, entry.new_value)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {etherscanUrl && (
          <div className="mt-4 text-center">
            <a 
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline inline-flex justify-center"
            >
              View contract on Etherscan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockchainLedger;
