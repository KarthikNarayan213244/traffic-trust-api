
// Export all API functions
export * from './types';
export * from './config';
export * from './vehicles';
export * from './rsus';
export * from './anomalies';
export * from './trustLedger';
export * from './congestion';
export * from './supabase';

// Helper function for accessing mock data
export const getMockData = (endpoint: string) => {
  switch (endpoint) {
    case "vehicles":
      return getMockVehicles();
    case "rsus":
      return getMockRSUs();
    case "anomalies":
      return getMockAnomalies();
    case "trustLedger":
      return getMockTrustLedger();
    case "congestion":
      return getMockCongestion();
    default:
      return [];
  }
};
