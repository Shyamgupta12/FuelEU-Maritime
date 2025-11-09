// Simple script to test PostgreSQL database connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fuel_eu_maritime',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testConnection() {
  console.log('🔍 Testing PostgreSQL Database Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'fuel_eu_maritime'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}\n`);

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Connection successful!\n');
    client.release();

    // Test 2: Check database version
    console.log('Test 2: Checking PostgreSQL version...');
    const versionResult = await pool.query('SELECT version()');
    console.log(`✅ PostgreSQL Version: ${versionResult.rows[0].version.split(',')[0]}\n`);

    // Test 3: Check if tables exist
    console.log('Test 3: Checking if tables exist...');
    
    // First, check what schema we're connected to
    const schemaResult = await pool.query(`
      SELECT current_schema(), current_database()
    `);
    console.log(`   Connected to database: ${schemaResult.rows[0].current_database}`);
    console.log(`   Current schema: ${schemaResult.rows[0].current_schema}\n`);
    
    // Check tables in public schema
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Also check all schemas
    const allTablesResult = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in "public" schema.');
      if (allTablesResult.rows.length > 0) {
        console.log(`   But found ${allTablesResult.rows.length} table(s) in other schemas:`);
        allTablesResult.rows.forEach(row => {
          console.log(`   - ${row.table_schema}.${row.table_name}`);
        });
        console.log('   Tables might be in a different schema.\n');
      } else {
        console.log('   You may need to run the schema.sql file.\n');
      }
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} table(s) in public schema:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Test 4: Check routes table data
    console.log('Test 4: Checking routes table...');
    try {
      const routesResult = await pool.query('SELECT COUNT(*) as count FROM routes');
      console.log(`✅ Routes table has ${routesResult.rows[0].count} record(s)\n`);
    } catch (error) {
      // Try with schema prefix
      try {
        const routesResult = await pool.query('SELECT COUNT(*) as count FROM public.routes');
        console.log(`✅ Routes table has ${routesResult.rows[0].count} record(s) (accessed via public.routes)\n`);
      } catch (error2) {
        console.log(`⚠️  Could not access routes table: ${error.message}`);
        console.log('   Trying to find the correct schema...\n');
        
        // Try to find routes table in any schema
        const findTable = await pool.query(`
          SELECT table_schema, table_name 
          FROM information_schema.tables 
          WHERE table_name = 'routes'
          AND table_type = 'BASE TABLE'
        `);
        
        if (findTable.rows.length > 0) {
          console.log(`   Found routes table in schema: ${findTable.rows[0].table_schema}`);
          console.log(`   Try accessing it as: ${findTable.rows[0].table_schema}.routes\n`);
        }
      }
    }

    // Test 5: Sample data query
    console.log('Test 5: Fetching sample route data...');
    const sampleResult = await pool.query('SELECT route_id, vessel_type, year FROM routes LIMIT 3');
    if (sampleResult.rows.length > 0) {
      console.log('✅ Sample data:');
      sampleResult.rows.forEach(row => {
        console.log(`   - ${row.route_id}: ${row.vessel_type} (${row.year})`);
      });
    } else {
      console.log('⚠️  No sample data found in routes table');
    }
    console.log('');

    // Test 6: Check compliance_balances
    console.log('Test 6: Checking compliance_balances table...');
    const cbResult = await pool.query('SELECT year, cb FROM compliance_balances LIMIT 3');
    if (cbResult.rows.length > 0) {
      console.log('✅ Compliance balances:');
      cbResult.rows.forEach(row => {
        console.log(`   - Year ${row.year}: ${row.cb} gCO₂e`);
      });
    } else {
      console.log('⚠️  No compliance balance data found');
    }
    console.log('');

    console.log('🎉 All tests passed! Database is working correctly.\n');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error details:');
    console.error(`  Code: ${error.code}`);
    console.error(`  Message: ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Troubleshooting:');
      console.log('   - Make sure PostgreSQL service is running');
      console.log('   - Check if the port (5432) is correct');
      console.log('   - Verify DB_HOST in .env file\n');
    } else if (error.code === '28P01') {
      console.log('💡 Troubleshooting:');
      console.log('   - Check your username and password in .env file');
      console.log('   - Verify DB_USER and DB_PASSWORD are correct\n');
    } else if (error.code === '3D000') {
      console.log('💡 Troubleshooting:');
      console.log('   - Database does not exist');
      console.log('   - Run: createdb -U postgres fuel_eu_maritime\n');
    } else if (error.code === '42P01') {
      console.log('💡 Troubleshooting:');
      console.log('   - Tables do not exist');
      console.log('   - Run: psql -U postgres -d fuel_eu_maritime -f backend/database/schema.sql\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

