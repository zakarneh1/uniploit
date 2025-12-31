import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, name, oauthProvider, oauthId, avatarUrl } = req.body;

    // Handle Google OAuth signup
    if (oauthProvider === 'google' && oauthId) {
      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Create new user with Google OAuth
      const result = await pool.query(
        `INSERT INTO users (email, name, oauth_provider, oauth_id, avatar_url, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, name, oauth_provider, oauth_id, avatar_url`,
        [email.toLowerCase(), name, 'google', oauthId, avatarUrl, 'oauth-user']
      );

      const user = result.rows[0];

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          oauthProvider: user.oauth_provider,
          avatarUrl: user.avatar_url
        }
      });
    }

    // Handle regular email/password signup
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1,$2,$3)
       RETURNING id, email, name`,
      [email.toLowerCase(), hashed, name || null]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user });

  } catch (err) {
    console.error('Signup error:', err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
}
