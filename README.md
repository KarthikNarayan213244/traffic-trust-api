
# Hyderabad Traffic Trust Platform

A Smart Traffic Management System with real-time traffic monitoring, trust management via blockchain, and anomaly detection.

## Getting Started

### Prerequisites

- Node.js v16 or newer
- A modern web browser
- Metamask extension installed (for blockchain interactions)

### Environment Setup

Create a `.env` file in the project root directory based on the `.env.example` file:

```
# API Configuration
VITE_API_URL=http://localhost:5000

# Blockchain Configuration 
VITE_RPC_URL=https://eth-goerli.public.blastapi.io
VITE_CONTRACT_ADDRESS=0xYourContractAddressHere

# Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=YourGoogleMapsApiKeyHere
```

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Seed the database (via UI):
   - Navigate to the dashboard
   - Click the "Seed Database" button in the top right

### Features

- Real-time traffic visualization with vehicle tracking
- Trust management using blockchain technology
- Anomaly detection and alerts
- RSU (Roadside Unit) monitoring
- Traffic congestion heatmaps

### Blockchain Integration

The application integrates with Ethereum Goerli testnet. To interact with the blockchain features:

1. Install MetaMask browser extension
2. Connect to Goerli testnet
3. Use the "Connect Wallet" button in the app
4. View the live trust ledger and stake trust on vehicles

### Database

The application uses Supabase for data storage. The database can be seeded with test data using:

- The "Seed Database" button on the Dashboard
- The Edge Function at `/functions/v1/seed-data`

## License

This project is licensed under the MIT License.
