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
        return await getWorkspace(user.userId, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Workspace API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getWorkspace(userId, res) {
  // Get user profile
  const userResult = await pool.query(
    "SELECT id, email, name, gpa_scale, semester_start, semester_end FROM users WHERE id = $1",
    [userId]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const userRow = userResult.rows[0];
  const user = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    gpaScale: parseFloat(userRow.gpa_scale),
    semesterStart: userRow.semester_start,
    semesterEnd: userRow.semester_end,
  };

  // Get semesters
  const semestersResult = await pool.query(
    "SELECT id, name, start_date, end_date, is_current FROM semesters WHERE user_id = $1 ORDER BY start_date DESC",
    [userId]
  );

  const semesters = semestersResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
  }));

  // Get courses with weights and grades
  const coursesResult = await pool.query(
    `SELECT
      c.id, c.semester_id, c.code, c.name, c.credits, c.instructor,
      c.color, c.archived, c.final_letter_grade, c.final_grade_confirmed,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', aw.id,
            'name', aw.name,
            'weight', aw.weight
          )
        ) FILTER (WHERE aw.id IS NOT NULL),
        '[]'::json
      ) as weights,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', g.id,
            'assessmentType', g.assessment_type,
            'name', g.name,
            'entryType', g.entry_type,
            'score', g.score,
            'maxScore', g.max_score,
            'letterGrade', g.letter_grade,
            'percent', g.percent,
            'weight', g.weight,
            'date', g.date,
            'notes', g.notes
          )
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'::json
      ) as grades
    FROM courses c
    LEFT JOIN assessment_weights aw ON c.id = aw.course_id
    LEFT JOIN grades g ON c.id = g.course_id
    WHERE c.user_id = $1
    GROUP BY c.id
    ORDER BY c.created_at DESC`,
    [userId]
  );

  const courses = coursesResult.rows.map(row => ({
    id: row.id,
    semesterId: row.semester_id,
    code: row.code,
    name: row.name,
    credits: parseFloat(row.credits),
    instructor: row.instructor,
    color: row.color,
    archived: row.archived,
    weights: row.weights,
    grades: row.grades,
    finalLetterGrade: row.final_letter_grade,
    finalGradeConfirmed: row.final_grade_confirmed,
  }));

  // Get study sessions
  const sessionsResult = await pool.query(
    "SELECT id, course_id, title, topic, duration, priority, date, completed, notes FROM study_sessions WHERE user_id = $1 ORDER BY date DESC",
    [userId]
  );

  const sessions = sessionsResult.rows.map(row => ({
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

  const workspace = {
    user,
    semesters,
    courses,
    sessions,
  };

  return res.status(200).json(workspace);
}