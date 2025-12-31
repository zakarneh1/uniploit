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

  if (!id) {
    return res.status(400).json({ error: "Session ID required" });
  }

  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      "SELECT user_id FROM study_sessions WHERE id = $1",
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (ownershipCheck.rows[0].user_id !== user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    switch (req.method) {
      case "PUT":
        return await updateSession(id, req.body, res);
      case "DELETE":
        return await deleteSession(id, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Session API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateSession(id, data, res) {
  const {
    title,
    topic,
    duration,
    priority,
    date,
    completed,
    notes
  } = data;

  const result = await pool.query(
    `UPDATE study_sessions
     SET title = COALESCE($1, title),
         topic = COALESCE($2, topic),
         duration = COALESCE($3, duration),
         priority = COALESCE($4, priority),
         date = COALESCE($5, date),
         completed = COALESCE($6, completed),
         notes = COALESCE($7, notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING id, course_id, title, topic, duration, priority, date, completed, notes`,
    [title, topic, duration, priority, date, completed, notes, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Session not found" });
  }

  const row = result.rows[0];
  const session = {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    topic: row.topic,
    duration: parseInt(row.duration),
    priority: row.priority,
    date: row.date,
    completed: row.completed,
    notes: row.notes,
  };

  return res.status(200).json(session);
}

async function deleteSession(id, res) {
  const result = await pool.query("DELETE FROM study_sessions WHERE id = $1", [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(204).end();
}