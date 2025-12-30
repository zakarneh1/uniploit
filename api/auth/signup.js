import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../_db.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "Missing email/password" });

    // ✅ check env vars first
    if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: "Missing DATABASE_URL" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ ok: false, error: "Missing JWT_SECRET" });

    const pool = db();

    // ✅ check table exists
    await pool.query("SELECT 1 FROM users LIMIT 1");

    const password_hash = await bcrypt.hash(password, 10);

    const r = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [email.toLowerCase(), password_hash, name || null]
    );

    const user = r.rows[0];

    // optional: default semester
    await pool.query("INSERT INTO semesters (user_id, name, is_current) VALUES ($1,$2,true)", [
      user.id,
      "Current Semester",
    ]);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ ok: true, token, user });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
      hint: "Check Vercel Env Vars + DB tables + installed deps",
    });
  }
}
