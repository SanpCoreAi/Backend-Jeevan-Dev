const db = require("../../config/db");

const DoctorFileModel = {

  create: async ({ doctorId, fileKey, folderName, }) => {
    const sql = `
      INSERT INTO doctor_files 
      (doctor_id, file_key, folder_name)
      VALUES (?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      doctorId,
      fileKey,
      folderName,
    ]);

    return {
      id: result.insertId,
      doctorId,
      fileKey,
      folderName,
    };
  },

  findByDoctorId: async (doctorId, folderName = null) => {
    let sql = `
      SELECT id, doctor_id, file_key, folder_name, created_at
      FROM doctor_files
      WHERE doctor_id = ?
    `;

    const params = [doctorId];

    if (folderName) {
      sql += ` AND folder_name = ?`;
      params.push(folderName);
    }

    sql += ` ORDER BY id DESC`;

    const [rows] = await db.execute(sql, params);
    return rows;
  }
};

module.exports = DoctorFileModel;