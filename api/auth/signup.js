import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pg;

// Reuse pool between serverless invocations
let _pool;
function getPool() {
  if (_pool) return _pool;

  // Support common env var names (Neon/Vercel setups differ)
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    const keys = Object.keys(process.env).filter((k) =>
      ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "NEON_DATABASE_URL"].includes(k)
    );
    throw new Error(
      `Missing database connection string. Set DATABASE_URL (or POSTGRES_URL). Found keys: ${keys.join(", ") || "none"}`
    );
  }

  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
    max: 1, // serverless friendly
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  return _pool;
}

export default async function handler(req, res) {
  // Basic CORS (optional; safe)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, password, name } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email/password" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: "Missing JWT_SECRET (set it in Vercel env vars)" });
    }

    const p = getPool();

    // Normalize email
    const safeEmail = String(email).trim().toLowerCase();
    const safeName = name ? String(name).trim() : null;

    // Hash password
    const password_hash = await bcrypt.hash(String(password), 10);

    // Insert user
    let user;
    try {
      const r = await p.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1,$2,$3)
         RETURNING id, email, name`,
        [safeEmail, password_hash, safeName]
      );
      user = r.rows[0];
    } catch (e) {
      const msg = String(e?.message || e).toLowerCase();

      // Postgres unique violation
      if (e?.code === "23505" || msg.includes("duplicate key")) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Useful DB debug
      return res.status(500).json({
        error: "DB insert failed",
        details: String(e?.message || e),
        code: e?.code || null,
      });
    }

    // Optional: default semester (ignore if table missing)
    try {
      await p.query(
        "INSERT INTO semesters (user_id, name, is_current) VALUES ($1,$2,true)",
        [user.id, "Current Semester"]
      );
    } catch (_) {}

    // Sign token
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });

    return res.status(200).json({ token, user });
  } catch (e) {
    return res.status(500).json({
      error: "Signup route crashed",
      details: String(e?.message || e),
    });
  }
}
