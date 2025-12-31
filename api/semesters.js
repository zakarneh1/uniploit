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
        return await getSemesters(user.userId, res);
      case "POST":
        return await createSemester(user.userId, req.body, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Semesters API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getSemesters(userId, res) {
  const result = await pool.query(
    "SELECT id, name, start_date, end_date, is_current FROM semesters WHERE user_id = $1 ORDER BY start_date DESC",
    [userId]
  );

  const semesters = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
  }));

  return res.status(200).json(semesters);
}

async function createSemester(userId, data, res) {
  const { name, startDate, endDate, isCurrent } = data;

  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // If this is set as current, unset others
  if (isCurrent) {
    await pool.query(
      "UPDATE semesters SET is_current = FALSE WHERE user_id = $1",
      [userId]
    );
  }

  const result = await pool.query(
    `INSERT INTO semesters (user_id, name, start_date, end_date, is_current)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, start_date, end_date, is_current`,
    [userId, name, startDate, endDate, isCurrent || false]
  );

  const semester = {
    id: result.rows[0].id,
    name: result.rows[0].name,
    startDate: result.rows[0].start_date,
    endDate: result.rows[0].end_date,
    isCurrent: result.rows[0].is_current,
  };

  return res.status(201).json(semester);
}