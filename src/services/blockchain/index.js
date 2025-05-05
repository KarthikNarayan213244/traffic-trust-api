
// Re-export all blockchain functionality from a single entry point
import { 
  connectWallet, 
  getConnectedAddress,
  useStakingContract,
  useTrustLedgerContract 
} from './provider';
import { getTrustLedger } from './ledger';
import { stakeTrust, simulateStakeTrust } from './staking';

export {
  connectWallet,
  getConnectedAddress,
  getTrustLedger,
  stakeTrust,
  simulateStakeTrust,
  useStakingContract,
  useTrustLedgerContract
};
