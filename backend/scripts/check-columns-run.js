const { Client } = require('@prisma/client/runtime/library');

// Use raw psql via prisma db execute alternative
const https = require('https');
const http = require('http');

// Check columns via connection string
const { execSync } = require('child_process');

// Check via prisma migrate status output
try {
  const result = execSync(
    'npx prisma db execute --url "postgresql://postgres:aPyQzbtTlwQbujtyPrihynDHDgeIinGC@switchback.proxy.rlwy.net:35733/railway" --file scripts/check-columns.sql',
    { cwd: 'C:\\sygmaauto\\backend', encoding: 'utf8' }
  );
  console.log(result);
} catch (e) {
  console.error(e.message);
}
