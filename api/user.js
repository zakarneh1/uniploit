import pg from "pg";
import { requireUser } from "../_auth.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  const user = requireUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET":
        return await getUserProfile(user.userId, res);
      case "PUT":
        return await updateUserProfile(user.userId, req.body, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("User API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getUserProfile(userId, res) {
  const result = await pool.query(
    "SELECT id, email, name, gpa_scale, semester_start, semester_end FROM users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const row = result.rows[0];
  const user = {
    id: row.id,
    email: row.email,
    name: row.name,
    gpaScale: parseFloat(row.gpa_scale),
    semesterStart: row.semester_start,
    semesterEnd: row.semester_end,
  };

  return res.status(200).json(user);
}

async function updateUserProfile(userId, data, res) {
  const { name, gpaScale, semesterStart, semesterEnd } = data;

  const result = await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         gpa_scale = COALESCE($2, gpa_scale),
         semester_start = COALESCE($3, semester_start),
         semester_end = COALESCE($4, semester_end),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING id, email, name, gpa_scale, semester_start, semester_end`,
    [name, gpaScale, semesterStart, semesterEnd, userId]
  );

  const row = result.rows[0];
  const user = {
    id: row.id,
    email: row.email,
    name: row.name,
    gpaScale: parseFloat(row.gpa_scale),
    semesterStart: row.semester_start,
    semesterEnd: row.semester_end,
  };

  return res.status(200).json(user);
}