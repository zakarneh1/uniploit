import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pg;

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
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Missing email/password" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "Missing JWT_SECRET" });

    const p = getPool();

    const password_hash = await bcrypt.hash(password, 10);

    const r = await p.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [String(email).toLowerCase(), password_hash, name || null]
    );

    const user = r.rows[0];

    // default semester (ignore if table missing)
    try {
      await p.query("INSERT INTO semesters (user_id, name, is_current) VALUES ($1,$2,true)", [
        user.id,
        "Current Semester",
      ]);
    } catch {}

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ token, user });
  } catch (e) {
    // duplicate email
    if (String(e?.message || e).toLowerCase().includes("duplicate")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
