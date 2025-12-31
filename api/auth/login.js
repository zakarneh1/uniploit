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
    const { email, password, oauthProvider, oauthId, name, avatarUrl } = req.body;

    // Handle Google OAuth login
    if (oauthProvider === 'google' && oauthId) {
      // Find or create user with Google OAuth
      let result = await pool.query(
        "SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2",
        ['google', oauthId]
      );

      let user;
      if (result.rows.length === 0) {
        // Create new user with Google OAuth
        const insertResult = await pool.query(
          `INSERT INTO users (email, name, oauth_provider, oauth_id, avatar_url, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, email, name, oauth_provider, oauth_id, avatar_url`,
          [email.toLowerCase(), name, 'google', oauthId, avatarUrl, 'oauth-user']
        );
        user = insertResult.rows[0];
      } else {
        user = result.rows[0];
        // Update user info if needed
        if (name && name !== user.name) {
          await pool.query(
            "UPDATE users SET name = $1, avatar_url = $2 WHERE id = $3",
            [name, avatarUrl, user.id]
          );
          user.name = name;
          user.avatar_url = avatarUrl;
        }
      }

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

    // Handle regular email/password login
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check if this is an OAuth-only account
    if (user.oauth_provider && !user.password_hash) {
      return res.status(401).json({ error: "This account uses Google sign-in. Please use Google to sign in." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
}
