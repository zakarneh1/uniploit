import pg from "pg";

const { Pool } = pg;

// cache pool between invocations
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export default async function handler(req, res) {
  try {
    const p = getPool();
    const r = await p.query("SELECT NOW() as now");
    return res.status(200).json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
