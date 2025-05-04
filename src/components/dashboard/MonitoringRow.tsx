
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SystemHealthMonitor from "@/components/dashboard/SystemHealthMonitor";
import TrustLedgerTable from "@/components/dashboard/TrustLedgerTable";
import { Shield } from "lucide-react";

interface MonitoringRowProps {
  trustBlockchainData: any[];
  trustApiData: any[];
  isBlockchainLoading: boolean;
  connectedWallet: string | null;
  etherscanUrl: string;
}

const MonitoringRow: React.FC<MonitoringRowProps> = ({
  trustBlockchainData,
  trustApiData,
  isBlockchainLoading,
  connectedWallet,
  etherscanUrl
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SystemHealthMonitor />
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>Blockchain Trust Ledger</span>
          </CardTitle>
          <CardDescription>
            Real-time trust score changes secured by blockchain
            {connectedWallet && (
              <span className="block text-xs mt-1">
                Connected wallet: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrustLedgerTable 
            data={trustBlockchainData.length > 0 ? trustBlockchainData : trustApiData} 
            isLoading={isBlockchainLoading} 
            etherscanUrl={etherscanUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringRow;
