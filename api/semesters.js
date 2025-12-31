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

  const { id } = req.query;

  try {
    if (id) {
      // Individual semester operations
      switch (req.method) {
        case "GET":
          return await getSemester(id, res);
        case "PUT":
          return await updateSemester(id, req.body, res);
        case "DELETE":
          return await deleteSemester(id, res);
        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
    } else {
      // Collection operations
      switch (req.method) {
        case "GET":
          return await getSemesters(user.userId, res);
        case "POST":
          return await createSemester(user.userId, req.body, res);
        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
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

async function getSemester(id, res) {
  const result = await pool.query(
    "SELECT id, name, start_date, end_date, is_current FROM semesters WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Semester not found" });
  }

  const row = result.rows[0];
  const semester = {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
  };

  return res.status(200).json(semester);
}

async function updateSemester(id, data, res) {
  const { name, startDate, endDate, isCurrent } = data;

  // If setting as current, unset others for this user
  if (isCurrent) {
    const userResult = await pool.query(
      "SELECT user_id FROM semesters WHERE id = $1",
      [id]
    );
    const userId = userResult.rows[0].user_id;

    await pool.query(
      "UPDATE semesters SET is_current = FALSE WHERE user_id = $1 AND id != $2",
      [userId, id]
    );
  }

  const result = await pool.query(
    `UPDATE semesters
     SET name = COALESCE($1, name),
         start_date = COALESCE($2, start_date),
         end_date = COALESCE($3, end_date),
         is_current = COALESCE($4, is_current),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING id, name, start_date, end_date, is_current`,
    [name, startDate, endDate, isCurrent, id]
  );

  const row = result.rows[0];
  const semester = {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
  };

  return res.status(200).json(semester);
}

async function deleteSemester(id, res) {
  // This will cascade delete courses and related data due to foreign key constraints
  await pool.query("DELETE FROM semesters WHERE id = $1", [id]);

  return res.status(204).end();
}