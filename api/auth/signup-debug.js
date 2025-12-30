import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../_db.js";

export default async function handler(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "Missing email/password" });

    const pool = db();
    const password_hash = await bcrypt.hash(password, 10);

    const r = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [email.toLowerCase(), password_hash, name || null]
    );

    const user = r.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ ok: true, token, user });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
    });
  }
}
