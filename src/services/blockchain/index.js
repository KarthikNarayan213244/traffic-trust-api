
// Re-export all blockchain functionality from a single entry point
import { connectWallet, getConnectedAddress, addTrustUpdateListener, getTrustScore } from './provider';
import { getTrustLedger } from './ledger';
import { updateTrustScore, batchUpdateTrustScores } from './trustScores';
import { stakeTrust, simulateStakeTrust } from './staking';

export {
  connectWallet,
  getConnectedAddress,
  getTrustLedger,
  updateTrustScore,
  batchUpdateTrustScores,
  addTrustUpdateListener,
  getTrustScore,
  stakeTrust,
  simulateStakeTrust
};
