/**
 * Railway Release Script
 * Runs BEFORE the new container starts:
 * 1. Terminates idle/zombie Postgres connections from previous failed deploys
 * 2. Runs prisma db push to apply schema changes
 */
const { execSync } = require('child_process');
const { Client } = require('pg');

async function terminateAllAppConnections() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[release] DATABASE_URL not set, skipping terminate step.');
    return;
  }

  // Strip connection_limit params so this pg client can always connect
  const cleanUrl = url.split('?')[0];
  const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  params.delete('connection_limit');
  params.delete('pool_timeout');
  const finalUrl = params.toString() ? `${cleanUrl}?${params}` : cleanUrl;

  const client = new Client({
    connectionString: finalUrl,
    connectionTimeoutMillis: 15000,
    ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();

    // Show current connection count
    const countRes = await client.query(
      `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()`
    );
    console.log(`[release] Active connections before kill: ${countRes.rows[0].count}`);

    // Kill ALL other connections to this database, regardless of state
    const result = await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
    `);
    console.log(`[release] Terminated ${result.rowCount} connection(s).`);

    // Wait for connections to fully close
    await new Promise(r => setTimeout(r, 2000));

    const afterRes = await client.query(
      `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()`
    );
    console.log(`[release] Active connections after kill: ${afterRes.rows[0].count}`);
  } catch (err) {
    console.warn('[release] Could not terminate connections (non-fatal):', err.message);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

async function main() {
  await terminateAllAppConnections();

  console.log('[release] Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('[release] Done.');
}

main().catch((err) => {
  console.error('[release] Fatal error:', err.message);
  process.exit(1);
});
