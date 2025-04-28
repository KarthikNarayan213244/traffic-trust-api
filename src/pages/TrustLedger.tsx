
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import WalletConnectButton from "@/components/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTrustLedger } from "@/hooks/useTrustLedger";
import BlockchainLedger from "@/components/trust/BlockchainLedger";
import ApiLedger from "@/components/trust/ApiLedger";
import StakeTrustDialog from "@/components/trust/StakeTrustDialog";
import NetworkInfo from "@/components/trust/NetworkInfo";

const TrustLedger: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const {
    apiData,
    blockchainData,
    isApiLoading,
    isApiError,
    isBlockchainLoading,
    isBlockchainError,
    etherscanUrl,
    handleRefresh,
    loadApiData,
    loadBlockchainData,
  } = useTrustLedger();

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trust Ledger</h1>
            <NetworkInfo etherscanUrl={etherscanUrl} />
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isApiLoading || isBlockchainLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isApiLoading || isBlockchainLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <WalletConnectButton />
          </div>
        </div>

        <BlockchainLedger 
          data={blockchainData}
          isLoading={isBlockchainLoading}
          isError={isBlockchainError}
          etherscanUrl={etherscanUrl}
          onRetry={loadBlockchainData}
          onStakeClick={() => setIsDialogOpen(true)}
        />

        <ApiLedger 
          data={apiData}
          isLoading={isApiLoading}
          isError={isApiError}
          onRetry={loadApiData}
        />

        <StakeTrustDialog 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSuccess={loadBlockchainData}
        />
      </div>
    </MainLayout>
  );
};

export default TrustLedger;
