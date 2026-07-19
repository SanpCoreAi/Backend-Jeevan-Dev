const db = require("../../config/db");

const UserImageModel = {

  create: async ({ userId, fileKey, folderName }) => {
    if (!userId || !fileKey || !folderName) {
      throw new Error(
        "userId, fileKey and folderName are required."
      );
    }

    const sql = `
      INSERT INTO user_images
      (
        user_id,
        file_key,
        folder_name
      )
      VALUES
      (
        ?,
        ?,
        ?
      )
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
  },

  getByUserId: async (userId) => {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const sql = `
      SELECT
        id,
        user_id,
        file_key,
        folder_name,
        created_at
      FROM user_images
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [userId]);

    return rows[0] || null;
  },

  getAllByUserId: async (userId) => {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const sql = `
      SELECT
        id,
        user_id,
        file_key,
        folder_name,
        created_at
      FROM user_images
      WHERE user_id = ?
      ORDER BY id DESC
    `;

    const [rows] = await db.execute(sql, [userId]);

    return rows;
  },

  deleteById: async (id) => {
    if (!id) {
      throw new Error("Image ID is required.");
    }

    const sql = `
      DELETE FROM user_images
      WHERE id = ?
    `;

    const [result] = await db.execute(sql, [id]);

    return result.affectedRows > 0;
  },

  deleteAllByUserId: async (userId) => {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const sql = `
      DELETE FROM user_images
      WHERE user_id = ?
    `;

    const [result] = await db.execute(sql, [userId]);

    return result.affectedRows;
  },

};

module.exports = UserImageModel;