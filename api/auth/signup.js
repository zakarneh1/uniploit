import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing email/password" });

  const pool = db();
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const r = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [email.toLowerCase(), password_hash, name || null]
    );

    const user = r.rows[0];

    // default semester
    await pool.query(
      "INSERT INTO semesters (user_id, name, is_current) VALUES ($1,$2,true)",
      [user.id, "Current Semester"]
    );

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ token, user });
  } catch (e) {
    if (String(e).includes("duplicate")) return res.status(409).json({ error: "Email already exists" });
    return res.status(500).json({ error: "Server error" });
  }
}
