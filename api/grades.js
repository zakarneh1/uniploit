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
      case "POST":
        return await createGrade(user.userId, req.body, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
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