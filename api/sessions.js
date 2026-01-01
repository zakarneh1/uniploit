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
      // Individual session operations
      const parts = id.split('/');
      const sessionId = parts[0];
      const action = parts[1];

      switch (req.method) {
        case "GET":
          return await getSession(sessionId, res);
        case "PUT":
          return await updateSession(sessionId, req.body, res);
        case "DELETE":
          return await deleteSession(sessionId, res);
        case "POST":
          if (action === 'toggle') {
            return await toggleSessionComplete(sessionId, res);
          }
          return res.status(405).json({ error: "Method not allowed" });
        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
    } else {
      // Collection operations
      switch (req.method) {
        case "GET":
          return await getSessions(user.userId, req.query, res);
        case "POST":
          return await createSession(user.userId, req.body, res);
        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
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

async function getSession(id, res) {
  const result = await pool.query(
    `SELECT id, course_id, title, topic, duration, priority, date, completed, notes
     FROM study_sessions
     WHERE id = $1`,
    [id]
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

async function updateSession(id, data, res) {
  // Verify ownership
  const ownershipCheck = await pool.query(
    "SELECT user_id FROM study_sessions WHERE id = $1",
    [id]
  );

  if (ownershipCheck.rows.length === 0) {
    return res.status(404).json({ error: "Session not found" });
  }

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

async function toggleSessionComplete(id, res) {
  // Verify ownership
  const ownershipCheck = await pool.query(
    "SELECT user_id, completed FROM study_sessions WHERE id = $1",
    [id]
  );

  if (ownershipCheck.rows.length === 0) {
    return res.status(404).json({ error: "Session not found" });
  }

  const currentCompleted = ownershipCheck.rows[0].completed;

  const result = await pool.query(
    `UPDATE study_sessions
     SET completed = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, course_id, title, topic, duration, priority, date, completed, notes`,
    [!currentCompleted, id]
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