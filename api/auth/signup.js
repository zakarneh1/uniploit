const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../_db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const body = req.body || {};
    const email = body.email;
    const password = body.password;
    const name = body.name;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Missing email/password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, error: "Missing JWT_SECRET in Vercel env" });
    }

    const pool = db();

    // check table exists
    await pool.query("SELECT 1 FROM users LIMIT 1");

    const password_hash = await bcrypt.hash(password, 10);

    const r = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [String(email).toLowerCase(), password_hash, name || null]
    );

    const user = r.rows[0];

    // default semester (only if semesters table exists)
    try {
      await pool.query(
        "INSERT INTO semesters (user_id, name, is_current) VALUES ($1,$2,true)",
        [user.id, "Current Semester"]
      );
    } catch (_) {}

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ ok: true, token, user });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
