
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface NetworkInfoProps {
  etherscanUrl: string;
}

const NetworkInfo: React.FC<NetworkInfoProps> = ({ etherscanUrl }) => {
  const rpcUrl = import.meta.env.VITE_RPC_URL || 
    localStorage.getItem('env_VITE_RPC_URL') || 
    'Goerli Testnet';
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline">
        {rpcUrl.includes('goerli') ? 'Goerli Testnet' : 'Custom Network'}
      </Badge>
      {etherscanUrl && (
        <a 
          href={etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          View on Etherscan
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export default NetworkInfo;
