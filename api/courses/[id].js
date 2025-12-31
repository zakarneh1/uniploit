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
    return res.status(400).json({ error: "Course ID required" });
  }

  try {
    // Verify ownership
    const ownershipCheck = await pool.query(
      "SELECT user_id FROM courses WHERE id = $1",
      [id]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (ownershipCheck.rows[0].user_id !== user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    switch (req.method) {
      case "GET":
        return await getCourse(id, res);
      case "PUT":
        return await updateCourse(id, req.body, res);
      case "DELETE":
        return await deleteCourse(id, res);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Course API error:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function getCourse(id, res) {
  const result = await pool.query(
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
    WHERE c.id = $1
    GROUP BY c.id`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Course not found" });
  }

  const row = result.rows[0];
  const course = {
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
  };

  return res.status(200).json(course);
}

async function updateCourse(id, data, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      code,
      name,
      credits,
      instructor,
      color,
      archived,
      weights,
      finalLetterGrade,
      finalGradeConfirmed
    } = data;

    // Update course
    const courseResult = await client.query(
      `UPDATE courses
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           credits = COALESCE($3, credits),
           instructor = COALESCE($4, instructor),
           color = COALESCE($5, color),
           archived = COALESCE($6, archived),
           final_letter_grade = COALESCE($7, final_letter_grade),
           final_grade_confirmed = COALESCE($8, final_grade_confirmed),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, semester_id, code, name, credits, instructor, color, archived, final_letter_grade, final_grade_confirmed`,
      [code, name, credits, instructor, color, archived, finalLetterGrade, finalGradeConfirmed, id]
    );

    // Update assessment weights if provided
    if (weights !== undefined) {
      // Delete existing weights
      await client.query("DELETE FROM assessment_weights WHERE course_id = $1", [id]);

      // Insert new weights
      if (weights.length > 0) {
        const weightValues = weights.map(weight =>
          `($1, '${weight.name}', ${weight.weight})`
        ).join(', ');

        await client.query(
          `INSERT INTO assessment_weights (course_id, name, weight) VALUES ${weightValues}`,
          [id]
        );
      }
    }

    await client.query('COMMIT');

    // Return updated course with weights and grades
    const updatedResult = await client.query(
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
      WHERE c.id = $1
      GROUP BY c.id`,
      [id]
    );

    const row = updatedResult.rows[0];
    const course = {
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
    };

    return res.status(200).json(course);

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteCourse(id, res) {
  // This will cascade delete grades and assessment weights due to foreign key constraints
  await pool.query("DELETE FROM courses WHERE id = $1", [id]);

  return res.status(204).end();
}