-- Manual script to create ship_compliance table
-- Run this in pgAdmin Query Tool or psql

-- Create the ship_compliance table
CREATE TABLE IF NOT EXISTS ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  cb_gco2eq DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ship_id, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);
CREATE INDEX IF NOT EXISTS idx_ship_compliance_year ON ship_compliance(year);

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'ship_compliance' 
ORDER BY ordinal_position;

