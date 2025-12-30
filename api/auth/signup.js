import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing email/password" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "Missing JWT_SECRET" });

    const pool = db();

    const password_hash = await bcrypt.hash(String(password), 10);

    const r = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [String(email).trim().toLowerCase(), password_hash, name ? String(name).trim() : null]
    );

    const user = r.rows[0];

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ token, user });
  } catch (e) {
    // Unique violation (duplicate email)
    if (e?.code === "23505") return res.status(409).json({ error: "Email already exists" });

    return res.status(500).json({ error: String(e?.message || e), code: e?.code || null });
  }
}
