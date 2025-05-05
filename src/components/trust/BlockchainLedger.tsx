import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, PlusCircle, ExternalLink, Shield } from "lucide-react";
import NetworkInfo from "@/components/trust/NetworkInfo";

interface BlockchainLedgerProps {
  data: any[];
  isLoading: boolean;
  isError: boolean;
  etherscanUrl: string;
  onRetry: () => void;
  onStakeClick: () => void;
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({
  data = [],
  isLoading = false,
  isError = false,
  etherscanUrl = '',
  onRetry,
  onStakeClick
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

  // Format Tx Id for display
  const formatTxId = (txId: string) => {
    if (!txId || txId.length < 10) return txId;
    return `${txId.substring(0, 6)}...${txId.substring(txId.length - 4)}`;
  };

  // Get action badge based on action type
  const getActionBadge = (action: string) => {
    const normalizedAction = action?.toUpperCase() || '';
    
    if (normalizedAction.includes('TRUST') || normalizedAction.includes('UPDATE')) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Trust Update</Badge>;
    } else if (normalizedAction.includes('STAKE') || normalizedAction.includes('PROTECT')) {
      return <Badge className="bg-green-500 hover:bg-green-600">Stake Added</Badge>;
    } else if (normalizedAction.includes('ATTACK') || normalizedAction.includes('MITIGATE')) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Attack Mitigated</Badge>;
    } else {
      return <Badge>{action}</Badge>;
    }
  };

  // Log etherscanUrl when component renders or updates
  React.useEffect(() => {
    console.log("BlockchainLedger received etherscanUrl:", etherscanUrl);
  }, [etherscanUrl]);

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Protection</CardTitle>
          <CardDescription>
            Trust ledger data stored on the blockchain
          </CardDescription>
          {etherscanUrl && <NetworkInfo etherscanUrl={etherscanUrl} />}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to load blockchain data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your wallet to view blockchain protection data for RSUs
            </p>
            <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button onClick={onStakeClick} className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Add Blockchain Protection</span>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Protection</CardTitle>
          <CardDescription>
            Trust ledger data stored on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>RSU ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Trust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Data loaded state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blockchain Protection</CardTitle>
        <CardDescription className="flex flex-col space-y-1">
          <span>Trust ledger data stored on the blockchain for RSUs</span>
          {etherscanUrl && (
            <a 
              href={etherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 w-fit"
            >
              View contract on Etherscan
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>RSU ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Trust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No blockchain data available yet. Add blockchain protection to secure RSUs.
                </TableCell>
              </TableRow>
            ) : (
              data.map((entry, index) => (
                <TableRow key={entry.tx_id || index}>
                  <TableCell className="font-mono text-xs">
                    {formatTxId(entry.tx_id)}
                  </TableCell>
                  <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                  <TableCell>
                    {entry.target_id || entry.rsu_id || "RSU"}
                  </TableCell>
                  <TableCell>
                    {getActionBadge(entry.action)}
                  </TableCell>
                  <TableCell>
                    {entry.old_value !== undefined && entry.new_value !== undefined ? (
                      <Badge className={entry.new_value >= entry.old_value ? "bg-green-500" : "bg-red-500"}>
                        {entry.new_value}
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500">
                        Protected
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
        <Button onClick={onStakeClick} className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Add Protection</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BlockchainLedger;
