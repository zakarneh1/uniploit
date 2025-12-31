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
      // Individual grade operations
      switch (req.method) {
        case "PUT":
          return await updateGrade(id, req.body, res);
        case "DELETE":
          return await deleteGrade(id, res);
        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
    } else {
      // Collection operations
      switch (req.method) {
        case "POST":
          return await createGrade(user.userId, req.body, res);
        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
    }
  } catch (err) {
    console.error("Grades API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function createGrade(userId, data, res) {
  const {
    courseId,
    assessmentType,
    name,
    entryType,
    score,
    maxScore,
    letterGrade,
    percent,
    weight,
    date,
    notes
  } = data;

  if (!courseId || !assessmentType || !name || !entryType || !percent || !weight || !date) {
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
    `INSERT INTO grades (course_id, assessment_type, name, entry_type, score, max_score, letter_grade, percent, weight, date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, course_id, assessment_type, name, entry_type, score, max_score, letter_grade, percent, weight, date, notes`,
    [courseId, assessmentType, name, entryType, score, maxScore, letterGrade, percent, weight, date, notes]
  );

  const row = result.rows[0];
  const grade = {
    id: row.id,
    courseId: row.course_id,
    assessmentType: row.assessment_type,
    name: row.name,
    entryType: row.entry_type,
    score: row.score ? parseFloat(row.score) : undefined,
    maxScore: row.max_score ? parseFloat(row.max_score) : undefined,
    letterGrade: row.letter_grade,
    percent: parseFloat(row.percent),
    weight: parseFloat(row.weight),
    date: row.date,
    notes: row.notes,
  };

  return res.status(201).json(grade);
}

async function updateGrade(id, data, res) {
  // Verify ownership through course
  const ownershipCheck = await pool.query(
    `SELECT c.user_id FROM grades g
     JOIN courses c ON g.course_id = c.id
     WHERE g.id = $1`,
    [id]
  );

  if (ownershipCheck.rows.length === 0) {
    return res.status(404).json({ error: "Grade not found" });
  }

  const {
    assessmentType,
    name,
    entryType,
    score,
    maxScore,
    letterGrade,
    percent,
    weight,
    date,
    notes
  } = data;

  const result = await pool.query(
    `UPDATE grades
     SET assessment_type = COALESCE($1, assessment_type),
         name = COALESCE($2, name),
         entry_type = COALESCE($3, entry_type),
         score = COALESCE($4, score),
         max_score = COALESCE($5, max_score),
         letter_grade = COALESCE($6, letter_grade),
         percent = COALESCE($7, percent),
         weight = COALESCE($8, weight),
         date = COALESCE($9, date),
         notes = COALESCE($10, notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING id, course_id, assessment_type, name, entry_type, score, max_score, letter_grade, percent, weight, date, notes`,
    [assessmentType, name, entryType, score, maxScore, letterGrade, percent, weight, date, notes, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Grade not found" });
  }

  const row = result.rows[0];
  const grade = {
    id: row.id,
    courseId: row.course_id,
    assessmentType: row.assessment_type,
    name: row.name,
    entryType: row.entry_type,
    score: row.score ? parseFloat(row.score) : undefined,
    maxScore: row.max_score ? parseFloat(row.max_score) : undefined,
    letterGrade: row.letter_grade,
    percent: parseFloat(row.percent),
    weight: parseFloat(row.weight),
    date: row.date,
    notes: row.notes,
  };

  return res.status(200).json(grade);
}

async function deleteGrade(id, res) {
  const result = await pool.query("DELETE FROM grades WHERE id = $1", [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Grade not found" });
  }

  return res.status(204).end();
}