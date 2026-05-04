const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = 'postgresql://postgres:aPyQzbtTlwQbujtyPrihynDHDgeIinGC@switchback.proxy.rlwy.net:35733/railway';
  const sqlFile = path.join(__dirname, '..', '..', 'create_commission_tables.sql');
  
  console.log('Reading SQL file:', sqlFile);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
