-- Quick SQL script to check tables in pgAdmin
-- Run this in pgAdmin Query Tool to verify tables exist

-- Check current database and schema
SELECT current_database() as database, current_schema() as schema;

-- List all tables in public schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Count records in each table
SELECT 'routes' as table_name, COUNT(*) as record_count FROM routes
UNION ALL
SELECT 'baselines', COUNT(*) FROM baselines
UNION ALL
SELECT 'compliance_balances', COUNT(*) FROM compliance_balances
UNION ALL
SELECT 'adjusted_compliance_balances', COUNT(*) FROM adjusted_compliance_balances
UNION ALL
SELECT 'banking', COUNT(*) FROM banking
UNION ALL
SELECT 'pools', COUNT(*) FROM pools
UNION ALL
SELECT 'pool_members', COUNT(*) FROM pool_members;

