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
        return await getCourses(user.userId, req.query, res);
      case "POST":
        return await createCourse(user.userId, req.body, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Courses API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getCourses(userId, query, res) {
  let sql = `
    SELECT
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
  `;

  const params = [userId];
  let paramIndex = 2;

  if (query.semesterId) {
    sql += ` AND c.semester_id = $${paramIndex}`;
    params.push(query.semesterId);
    paramIndex++;
  }

  sql += ` GROUP BY c.id ORDER BY c.created_at DESC`;

  const result = await pool.query(sql, params);

  const courses = result.rows.map(row => ({
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

  return res.status(200).json(courses);
}

async function createCourse(userId, data, res) {
  const {
    semesterId,
    code,
    name,
    credits,
    instructor,
    color,
    weights = []
  } = data;

  if (!semesterId || !code || !name || !credits) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify semester ownership
  const semesterCheck = await pool.query(
    "SELECT user_id FROM semesters WHERE id = $1",
    [semesterId]
  );

  if (semesterCheck.rows.length === 0 || semesterCheck.rows[0].user_id !== userId) {
    return res.status(403).json({ error: "Invalid semester" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert course
    const courseResult = await client.query(
      `INSERT INTO courses (user_id, semester_id, code, name, credits, instructor, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, semester_id, code, name, credits, instructor, color, archived, final_letter_grade, final_grade_confirmed`,
      [userId, semesterId, code, name, credits, instructor || null, color || '#3b82f6']
    );

    const course = courseResult.rows[0];

    // Insert assessment weights
    if (weights.length > 0) {
      const weightValues = weights.map(weight =>
        `(${course.id}, '${weight.name}', ${weight.weight})`
      ).join(', ');

      await client.query(
        `INSERT INTO assessment_weights (course_id, name, weight) VALUES ${weightValues}`
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      id: course.id,
      semesterId: course.semester_id,
      code: course.code,
      name: course.name,
      credits: parseFloat(course.credits),
      instructor: course.instructor,
      color: course.color,
      archived: course.archived,
      weights: weights,
      grades: [],
      finalLetterGrade: course.final_letter_grade,
      finalGradeConfirmed: course.final_grade_confirmed,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}