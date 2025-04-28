
# Smart Traffic Management System Data Generator

This module provides realistic, high-volume data generation for Hyderabad's Smart Traffic Management System. It creates historical seed data and simulates real-time traffic data.

## Features

- **Historical Seed Data**: Pre-populates vehicle, congestion, anomaly, and trust ledger data for the past 24 hours
- **Realistic Traffic Patterns**: Follows real-world diurnal traffic patterns (morning/evening peaks, midday lulls)
- **Real-time Simulation**: Continuously generates new data in the background
- **High Volume**: Creates thousands of records for visualization and testing

## Usage

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables (create a `.env` file with):
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

3. Run the script with various options:

   ```
   # Seed historical data and start simulation
   python seed_data.py --seed --simulate
   
   # Clear existing data, seed new data, then simulate
   python seed_data.py --clear --seed --simulate
   
   # Only seed historical data (no simulation)
   python seed_data.py --seed
   
   # Specify custom data volumes
   python seed_data.py --seed --vehicles 20000 --anomalies 5000 --trust 2000
   ```

## Data Generators

- **VehicleGenerator**: Creates vehicle records with realistic license plates, positions, and movement patterns
- **CongestionGenerator**: Simulates traffic congestion levels across Hyderabad's major zones
- **AnomalyGenerator**: Creates anomaly records like overspeed, emergency braking, and RSU offline alerts
- **TrustGenerator**: Simulates blockchain trust ledger entries for vehicles

## Configuration

Edit `config.py` to modify:

- Geographic zones and junctions
- Traffic pattern coefficients
- Vehicle types and distribution
- Anomaly types and severities
- Simulation interval settings
