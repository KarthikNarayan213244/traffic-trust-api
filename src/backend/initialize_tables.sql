
-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id VARCHAR(20) NOT NULL UNIQUE,
  owner_name VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading INTEGER,
  location VARCHAR(100),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- Create RSUs (Roadside Units) table
CREATE TABLE IF NOT EXISTS public.rsus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rsu_id VARCHAR(20) NOT NULL UNIQUE,
  location VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  coverage_radius INTEGER NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Create anomalies table
CREATE TABLE IF NOT EXISTS public.anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vehicle_id VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'Detected'
);

-- Create trust ledger table
CREATE TABLE IF NOT EXISTS public.trust_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id VARCHAR(100) NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vehicle_id VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_value INTEGER NOT NULL,
  new_value INTEGER NOT NULL,
  details TEXT
);

-- Create congestion zones table
CREATE TABLE IF NOT EXISTS public.zones_congestion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name VARCHAR(100) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  congestion_level INTEGER NOT NULL CHECK (congestion_level >= 0 AND congestion_level <= 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_id ON public.vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_timestamp ON public.vehicles(timestamp);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON public.anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_anomalies_vehicle_id ON public.anomalies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trust_ledger_timestamp ON public.trust_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_trust_ledger_vehicle_id ON public.trust_ledger(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_zones_congestion_zone_name ON public.zones_congestion(zone_name);
CREATE INDEX IF NOT EXISTS idx_zones_congestion_updated_at ON public.zones_congestion(updated_at);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones_congestion ENABLE ROW LEVEL SECURITY;

-- Set default policies to allow all access (these can be restricted later)
CREATE POLICY IF NOT EXISTS all_access_policy ON public.vehicles FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS all_access_policy ON public.rsus FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS all_access_policy ON public.anomalies FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS all_access_policy ON public.trust_ledger FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS all_access_policy ON public.zones_congestion FOR ALL USING (true);

-- Add realtime support
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.anomalies REPLICA IDENTITY FULL;
ALTER TABLE public.zones_congestion REPLICA IDENTITY FULL;

-- Enable publications for realtime
BEGIN;
  -- Drop if exists first to avoid errors on re-run
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create the publication with all tables
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.vehicles, 
    public.rsus, 
    public.anomalies, 
    public.trust_ledger, 
    public.zones_congestion;
COMMIT;
