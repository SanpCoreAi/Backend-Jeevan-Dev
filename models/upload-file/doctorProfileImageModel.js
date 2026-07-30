const db = require("../../config/db");

const create = async ({
  userId,
  fileKey,
  folderName,
}) => {
  const sql = `
    INSERT INTO user_images
    (
      user_id,
      file_key,
      folder_name
    )
    VALUES (?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    userId,
    fileKey,
    folderName,
  ]);

  return {
    id: result.insertId,
    userId,
    fileKey,
    folderName,
  };
};

const getByUserId = async (userId) => {
  const sql = `
    SELECT
      id,
      user_id,
      file_key,
      folder_name,
      created_at
    FROM user_images
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.length ? rows[0] : null;
};

const getAllByUserId = async (userId) => {
  const sql = `
    SELECT
      id,
      user_id,
      file_key,
      folder_name,
      created_at
    FROM user_images
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await db.execute(sql, [userId]);

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    fileKey: row.file_key,
    folderName: row.folder_name,
    fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${row.file_key}`,
    createdAt: row.created_at,
  }));
};

const deleteById = async (id) => {
  const sql = `
    DELETE FROM user_images
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [id]);

  return result.affectedRows > 0;
};


const deleteAllByUserId = async (userId) => {
  const sql = `
    DELETE FROM user_images
    WHERE user_id = ?
  `;

  const [result] = await db.execute(sql, [userId]);

  return result.affectedRows;
};

module.exports = {
  create,
  getByUserId,
  getAllByUserId,
  deleteById,
  deleteAllByUserId,
};