// models/likeModel.js
const db = require("../config/db");

const createLike = async (userId, doctorId) => {
  const sql = `INSERT INTO likes (user_id, doctor_id) VALUES (?, ?)`;
  return db.execute(sql, [userId, doctorId]);
};

const findLike = async (userId, doctorId) => {
  const sql = `SELECT id FROM likes WHERE user_id=? AND doctor_id=?`;
  const [rows] = await db.execute(sql, [userId, doctorId]);
  return rows;
};

const deleteLike = async (userId, doctorId) => {
  const sql = `DELETE FROM likes WHERE user_id=? AND doctor_id=?`;
  return db.execute(sql, [userId, doctorId]);
};

const getLikedDoctors = async (userId, limit, offset) => {
  const sql = `
    SELECT d.id, d.name, d.specialization, d.profile_image
    FROM likes l
    JOIN doctors d ON l.doctor_id = d.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.execute(sql, [userId, limit, offset]);
  return rows;
};

const countLikedDoctors = async (userId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) as total FROM likes WHERE user_id=?`,
    [userId]
  );
  return rows[0].total;
};

exports.findUserByToken = async (token) => {
  try {
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      WHERE a.token = ?
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [token]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];

  } catch (error) {
    console.error("Model DB Error:", error);
    throw error;
  }
};

module.exports = {
  createLike,
  findLike,
  deleteLike,
  getLikedDoctors,
  countLikedDoctors
};