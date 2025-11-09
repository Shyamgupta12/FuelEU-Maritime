-- Fuel EU Maritime Database Schema
-- Run this script to create all necessary tables

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  route_id VARCHAR(50) PRIMARY KEY,
  vessel_type VARCHAR(100) NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity DECIMAL(10, 2) NOT NULL,
  fuel_consumption DECIMAL(15, 2) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  total_emissions DECIMAL(15, 2) NOT NULL,
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Baselines table
CREATE TABLE IF NOT EXISTS baselines (
  route_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity DECIMAL(10, 2) NOT NULL,
  fuel_consumption DECIMAL(15, 2) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  total_emissions DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id, year)
);

-- Compliance balances table
CREATE TABLE IF NOT EXISTS compliance_balances (
  year INTEGER PRIMARY KEY,
  cb DECIMAL(15, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adjusted compliance balances table
CREATE TABLE IF NOT EXISTS adjusted_compliance_balances (
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  adjusted_cb DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ship_id, year)
);

-- Banking table
CREATE TABLE IF NOT EXISTS banking (
  year INTEGER PRIMARY KEY,
  banked_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
  pool_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  year INTEGER NOT NULL,
  total_cb DECIMAL(15, 2) NOT NULL,
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pool members table
CREATE TABLE IF NOT EXISTS pool_members (
  pool_id VARCHAR(50) NOT NULL,
  ship_id VARCHAR(50) NOT NULL,
  cb_before_pool DECIMAL(15, 2) NOT NULL,
  cb_after_pool DECIMAL(15, 2) NOT NULL,
  PRIMARY KEY (pool_id, ship_id),
  FOREIGN KEY (pool_id) REFERENCES pools(pool_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routes_year ON routes(year);
CREATE INDEX IF NOT EXISTS idx_routes_vessel_type ON routes(vessel_type);
CREATE INDEX IF NOT EXISTS idx_routes_is_baseline ON routes(is_baseline);
CREATE INDEX IF NOT EXISTS idx_baselines_route_year ON baselines(route_id, year);
CREATE INDEX IF NOT EXISTS idx_adjusted_cb_year ON adjusted_compliance_balances(year);
CREATE INDEX IF NOT EXISTS idx_pool_members_pool_id ON pool_members(pool_id);

-- Insert sample data (optional - for testing)
INSERT INTO routes (route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
VALUES 
  ('route-001', 'Container Ship', 'MGO', 2024, 85.5, 5000000, 1200, 427500000, false),
  ('route-002', 'Bulk Carrier', 'HFO', 2024, 92.3, 8000000, 2000, 738400000, false),
  ('route-003', 'Tanker', 'LNG', 2024, 78.2, 6000000, 1500, 469200000, false),
  ('R001', 'Container Ship', 'HFO', 2023, 91.5, 2500, 5000, 7500, false),
  ('R002', 'Tanker', 'VLSFO', 2023, 88.2, 3200, 6500, 9200, false)
ON CONFLICT (route_id) DO NOTHING;

INSERT INTO compliance_balances (year, cb)
VALUES (2024, 1500000)
ON CONFLICT (year) DO NOTHING;

INSERT INTO adjusted_compliance_balances (ship_id, year, adjusted_cb)
VALUES 
  ('ship-001', 2024, 500000),
  ('ship-002', 2024, -300000),
  ('ship-003', 2024, 800000),
  ('ship-004', 2024, -200000)
ON CONFLICT (ship_id, year) DO NOTHING;

