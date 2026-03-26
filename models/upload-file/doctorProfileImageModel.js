const db = require("../../config/db");

const DoctorFileModel = {

  create: async ({ doctorId, fileKey, folderName }) => {
    if (!doctorId || !fileKey || !folderName) {
      throw new Error("All parameters (doctorId, fileKey, folderName) are required");
    }

    const sql = `
      INSERT INTO doctor_image (doctor_id, file_key, folder_name)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.execute(sql, [doctorId, fileKey, folderName]);

    return { id: result.insertId, doctorId, fileKey, folderName };
  },

  getByDoctorId: async (doctorId) => {
    if (!doctorId) throw new Error("doctorId is required");

    const sql = `
      SELECT *
      FROM doctor_image
      WHERE doctor_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, [doctorId]);
    return rows[0] || null;
  },

  getAllByDoctorId: async (doctorId) => {
    if (!doctorId) throw new Error("doctorId is required");

    const sql = `
      SELECT id, file_key, folder_name, created_at
      FROM doctor_image
      WHERE doctor_id = ?
      ORDER BY id DESC
    `;
    const [rows] = await db.execute(sql, [doctorId]);
    return rows;
  },

  deleteById: async (id) => {
    if (!id) throw new Error("id is required");

    const sql = `DELETE FROM doctor_image WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  },

  deleteAllByDoctorId: async (doctorId) => {
    if (!doctorId) throw new Error("doctorId is required");

    const sql = `DELETE FROM doctor_image WHERE doctor_id = ?`;
    const [result] = await db.execute(sql, [doctorId]);
    return result.affectedRows;
  },
};

module.exports = DoctorFileModel;
