const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:aPyQzbtTlwQbujtyPrihynDHDgeIinGC@switchback.proxy.rlwy.net:35733/railway', ssl: { rejectUnauthorized: false } });
c.connect()
  .then(() => c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name"))
  .then(r => { console.log('COLS:', r.rows.map(x => x.column_name).join(', ')); return c.end(); });
