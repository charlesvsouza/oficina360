const { Client } = require('pg');

async function run() {
  const c = new Client({
    connectionString: 'postgresql://postgres:aPyQzbtTlwQbujtyPrihynDHDgeIinGC@switchback.proxy.rlwy.net:35733/railway'
  });
  await c.connect();
  await c.query('DROP SCHEMA IF EXISTS evolution_r2 CASCADE');
  console.log('Schema dropped');
  await c.query('CREATE SCHEMA evolution_r2');
  console.log('Schema recreated');
  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
