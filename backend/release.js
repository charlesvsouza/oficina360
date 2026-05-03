/**
 * Railway Release Script
 * Runs BEFORE the new container starts:
 * 1. Terminates idle/zombie Postgres connections from previous failed deploys
 * 2. Runs prisma db push to apply schema changes
 */
const { execSync } = require('child_process');
const { Client } = require('pg');

async function terminateIdleConnections() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[release] DATABASE_URL not set, skipping terminate step.');
    return;
  }

  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    ssl: url.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND state IN ('idle', 'idle in transaction', 'idle in transaction (aborted)')
        AND query_start < NOW() - INTERVAL '10 seconds'
    `);
    console.log(`[release] Terminated ${result.rowCount} idle connection(s).`);
  } catch (err) {
    // Non-fatal: if we can't terminate, still try to proceed
    console.warn('[release] Could not terminate idle connections (non-fatal):', err.message);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

async function main() {
  await terminateIdleConnections();

  console.log('[release] Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('[release] Done.');
}

main().catch((err) => {
  console.error('[release] Fatal error:', err.message);
  process.exit(1);
});
