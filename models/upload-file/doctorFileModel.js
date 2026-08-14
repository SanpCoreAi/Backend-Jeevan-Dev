const db = require("../../config/db");

const create = async ({
  doctorId,
  fileKey,
  folderName,
}) => {
  const sql = `
    INSERT INTO doctor_files
    (
      doctor_id,
      file_key,
      folder_name
    )
    VALUES (?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    doctorId,
    fileKey,
    folderName,
  ]);

  const [rows] = await db.execute(
    `
      SELECT
        id,
        doctor_id,
        file_key,
        folder_name,
        created_at
      FROM doctor_files
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId]
  );

  if (!rows.length) {
    return null;
  }

  return {
    id: rows[0].id,
    doctorId: rows[0].doctor_id,
    file_key: rows[0].file_key,
    folder_name: rows[0].folder_name,
    created_at: rows[0].created_at,
  };
};

const findByDoctorId = async (
  doctorId,
  folderName = null
) => {

  let sql = `
    SELECT
      id,
      doctor_id,
      file_key,
      folder_name,
      created_at
    FROM doctor_files
    WHERE doctor_id = ?
  `;

  const params = [doctorId];

  if (folderName) {
    sql += ` AND folder_name = ?`;
    params.push(folderName);
  }


  sql += ` ORDER BY created_at DESC`;


  const [rows] = await db.execute(
    sql,
    params
  );


  return rows.map((row) => ({
    id: row.id,

    doctorId: row.doctor_id,

    file_key: row.file_key,

    folder_name: row.folder_name,

    // fileUrl:
    //   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${row.file_key}`,

    createdAt: row.created_at,
  }));
};

const findById = async (id) => {

  const sql = `
    SELECT
      id,
      doctor_id,
      file_key,
      folder_name,
      created_at
    FROM doctor_files
    WHERE id = ?
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const [rows] = await db.execute(
    sql,
    [id]
  );

  return rows.length
    ? {
        id: rows[0].id,
        doctorId: rows[0].doctor_id,
        file_key: rows[0].file_key,
        folder_name: rows[0].folder_name,
        createdAt: rows[0].created_at,
      }
    : null;
};

const softDelete = async (id) => {

  const sql = `
    UPDATE doctor_files
    SET deleted_at = NOW()
    WHERE id = ?
      AND deleted_at IS NULL
  `;

  const [result] = await db.execute(
    sql,
    [id]
  );

  return result.affectedRows > 0;
};


module.exports = {
  create,
  findByDoctorId,
  findById,
  softDelete,
};