import pg from "pg";
import { requireUser } from "../_auth.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = requireUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get full user data
    const result = await pool.query(
      "SELECT id, email, name, oauth_provider, oauth_id, avatar_url, gpa_scale, semester_start, semester_end FROM users WHERE id = $1",
      [user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = result.rows[0];
    const userResponse = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      oauthProvider: userData.oauth_provider,
      avatarUrl: userData.avatar_url,
      gpaScale: userData.gpa_scale || 4.0,
      semesterStart: userData.semester_start,
      semesterEnd: userData.semester_end,
    };

    return res.status(200).json({ user: userResponse });
  } catch (err) {
    console.error("Auth me error:", err);
    return res.status(500).json({ error: err.message });
  }
}