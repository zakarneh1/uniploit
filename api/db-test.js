import { db } from "./_db.js";

export default async function handler(req, res) {
  try {
    const pool = db();
    const r = await pool.query("SELECT NOW() as now");
    return res.status(200).json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}
