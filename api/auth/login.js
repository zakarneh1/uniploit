const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../_db");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Missing email/password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, error: "Missing JWT_SECRET in Vercel env" });
    }

    const pool = db();
    const r = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email=$1",
      [String(email).toLowerCase()]
    );

    if (!r.rows.length) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const u = r.rows[0];
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const token = jwt.sign({ userId: u.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ ok: true, token, user: { id: u.id, email: u.email, name: u.name } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
