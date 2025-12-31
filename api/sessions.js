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
        return await getSessions(user.userId, req.query, res);
      case "POST":
        return await createSession(user.userId, req.body, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Sessions API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getSessions(userId, query, res) {
  let sql = `
    SELECT id, course_id, title, topic, duration, priority, date, completed, notes
    FROM study_sessions
    WHERE user_id = $1
  `;

  const params = [userId];
  let paramIndex = 2;

  if (query.courseId) {
    sql += ` AND course_id = $${paramIndex}`;
    params.push(query.courseId);
    paramIndex++;
  }

  if (query.completed !== undefined) {
    sql += ` AND completed = $${paramIndex}`;
    params.push(query.completed === 'true');
    paramIndex++;
  }

  sql += ` ORDER BY date DESC, created_at DESC`;

  const result = await pool.query(sql, params);

  const sessions = result.rows.map(row => ({
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    topic: row.topic,
    duration: parseInt(row.duration),
    priority: row.priority,
    date: row.date,
    completed: row.completed,
    notes: row.notes,
  }));

  return res.status(200).json(sessions);
}

async function createSession(userId, data, res) {
  const {
    courseId,
    title,
    topic,
    duration,
    priority = 'medium',
    date,
    completed = false,
    notes
  } = data;

  if (!courseId || !title || !duration || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify course ownership
  const courseCheck = await pool.query(
    "SELECT user_id FROM courses WHERE id = $1",
    [courseId]
  );

  if (courseCheck.rows.length === 0 || courseCheck.rows[0].user_id !== userId) {
    return res.status(403).json({ error: "Invalid course" });
  }

  const result = await pool.query(
    `INSERT INTO study_sessions (user_id, course_id, title, topic, duration, priority, date, completed, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, course_id, title, topic, duration, priority, date, completed, notes`,
    [userId, courseId, title, topic, duration, priority, date, completed, notes]
  );

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

  return res.status(201).json(session);
}