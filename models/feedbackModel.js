const db = require("../config/db");

async function createFeedback(user_id, doctor_id, feedback_text, rating = null) {
  const [result] = await db.query(
    `INSERT INTO feedbacks (user_id, doctor_id, feedback_text, rating)
     VALUES (?, ?, ?, ?)`,
    [user_id, doctor_id, feedback_text, rating]
  );

  return result.insertId;
}

async function checkUserFeedback(user_id, doctor_id) {

  const [rows] = await db.query(
    `
    SELECT id
    FROM feedbacks
    WHERE user_id = ?
    AND doctor_id = ?
    LIMIT 1
    `,
    [
      user_id,
      doctor_id
    ]
  );


  return rows.length > 0;

}

async function getAllFeedbacks() {
  const [rows] = await db.query(`
    SELECT 
      f.id,
      f.user_id,
      u.full_name,
      f.doctor_id,
      f.feedback_text,
      f.rating,
      f.created_at
    FROM feedbacks f
    JOIN users u 
      ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `);

  return rows;
}

async function getDoctorFeedbacks(doctor_id) {
  const [rows] = await db.query(
    `SELECT 
      id,
      user_id,
      feedback_text,
      rating,
      created_at
     FROM feedbacks
     WHERE doctor_id = ?
     ORDER BY created_at DESC`,
    [doctor_id]
  );

  return rows;
}

async function getAllDoctorsRatingSummary() {
  const [rows] = await db.query(
    `SELECT 
      doctor_id,
      COUNT(*) AS total_feedbacks,
      COUNT(rating) AS total_ratings,
      ROUND(AVG(rating), 1) AS avg_rating,

      -- ✅ ADD THIS
      SUM(CASE WHEN rating > 3 THEN 1 ELSE 0 END) AS positive_feedbacks,
      SUM(CASE WHEN rating <= 3 THEN 1 ELSE 0 END) AS negative_feedbacks

     FROM feedbacks
     GROUP BY doctor_id
     ORDER BY avg_rating DESC`
  );

  return rows;
}


async function getFeedbackReplies(feedback_id) {
  const [rows] = await db.query(
    `SELECT 
      id,
      doctor_id,
      reply_text,
      created_at
     FROM feedback_replies
     WHERE feedback_id = ?
     ORDER BY created_at ASC`,
    [feedback_id]
  );

  return rows;
}

module.exports = {
  createFeedback,
  getAllFeedbacks,
  getDoctorFeedbacks,
  getAllDoctorsRatingSummary,
  checkUserFeedback,
  getFeedbackReplies
};
