import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing email/password" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "Missing JWT_SECRET" });

    const pool = db();

    const r = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email=$1",
      [String(email).trim().toLowerCase()]
    );

    if (!r.rows.length) return res.status(401).json({ error: "Invalid credentials" });

    const u = r.rows[0];
    const ok = await bcrypt.compare(String(password), u.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: u.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ token, user: { id: u.id, email: u.email, name: u.name } });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
