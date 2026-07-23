const db = require("../config/db");

exports.createFeedback = async (
  userId,
  doctorId,
  feedbackText,
  rating = null
) => {

  const [result] = await db.execute(
    `
    INSERT INTO feedbacks
    (
      user_id,
      doctor_id,
      feedback_text,
      rating
    )
    VALUES
    (?, ?, ?, ?)
    `,
    [
      userId,
      doctorId,
      feedbackText,
      rating
    ]
  );

  return result.insertId;
};

exports.checkUserFeedback = async (
  userId,
  doctorId
) => {

  const [rows] = await db.execute(
    `
    SELECT id

    FROM feedbacks

    WHERE
      user_id = ?
      AND doctor_id = ?

    LIMIT 1
    `,
    [
      userId,
      doctorId
    ]
  );

  return rows.length > 0;
};

exports.getAllFeedbacks = async () => {

  const [rows] = await db.execute(
    `
    SELECT

      f.id AS feedback_id,

      f.user_id,

      u.full_name,

      u.email,

      f.doctor_id,

      f.feedback_text,

      f.rating,

      f.created_at

    FROM feedbacks f

    INNER JOIN users u
      ON u.id = f.user_id

    ORDER BY f.created_at DESC
    `
  );

  return rows;
};

exports.getDoctorFeedbacks = async (
  doctorId
) => {

  const [rows] = await db.execute(
    `
    SELECT

      f.id AS feedback_id,

      f.user_id,

      u.full_name,

      u.email,

      f.feedback_text,

      f.rating,

      f.created_at

    FROM feedbacks f

    INNER JOIN users u
      ON u.id = f.user_id

    WHERE f.doctor_id = ?

    ORDER BY f.created_at DESC
    `,
    [doctorId]
  );

  return rows;
};

exports.getAllDoctorsRatingSummary = async () => {

  const [rows] = await db.execute(
    `
    SELECT

      doctor_id,

      COUNT(*) AS total_feedbacks,

      COUNT(rating) AS total_ratings,

      ROUND(AVG(rating),1) AS avg_rating,

      SUM(
        CASE
          WHEN rating > 3
          THEN 1
          ELSE 0
        END
      ) AS positive_feedbacks,

      SUM(
        CASE
          WHEN rating <= 3
          THEN 1
          ELSE 0
        END
      ) AS negative_feedbacks

    FROM feedbacks

    GROUP BY doctor_id

    ORDER BY avg_rating DESC
    `
  );

  return rows;
};

exports.getFeedbackReplies = async (
  feedbackId
) => {

  const [rows] = await db.execute(
    `
    SELECT

      id,

      doctor_id,

      reply_text,

      created_at

    FROM feedback_replies

    WHERE feedback_id = ?

    ORDER BY created_at ASC
    `,
    [feedbackId]
  );

  return rows;
};