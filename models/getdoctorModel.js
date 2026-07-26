const db = require("../config/db");

const parseJSON = (value, defaultValue = []) => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }

  return defaultValue;
};

exports.findDoctors = async (filters = {}) => {
  try {

    let sql = `
      SELECT
        d.id AS doctor_id,
        d.user_id,
        d.username,
        d.specialization,
        d.qualification AS education,
        d.experience,
        d.consultation_fee AS fee,
        d.language,
        d.age,
        d.gender,
        d.hospital_detail,

        u.full_name,
        u.email,
        u.phone_number,

        JSON_UNQUOTE(
          JSON_EXTRACT(
            d.hospital_detail,
            '$[0].hospitalName'
          )
        ) AS hospital_name,

        (
          SELECT ui.file_key
          FROM user_images ui
          WHERE ui.user_id = d.user_id
          ORDER BY ui.id DESC
          LIMIT 1
        ) AS photo

      FROM doctors d

      INNER JOIN users u
        ON u.id = d.user_id

      WHERE 1 = 1
    `;

    const params = [];

    if (filters.name) {
      sql += " AND u.full_name LIKE ?";
      params.push(`%${filters.name}%`);
    }

    if (filters.email) {
      sql += " AND u.email LIKE ?";
      params.push(`%${filters.email}%`);
    }

    if (filters.phone_number) {
      sql += " AND u.phone_number LIKE ?";
      params.push(`%${filters.phone_number}%`);
    }

    if (filters.specialization) {
      sql += " AND d.specialization LIKE ?";
      params.push(`%${filters.specialization}%`);
    }

    sql += " ORDER BY d.id DESC";

    const [rows] = await db.execute(sql, params);

    return rows.map((doctor) => ({

      id: doctor.doctor_id,

      doctorId: doctor.doctor_id,

      userId: doctor.user_id,

      fullName: doctor.full_name,

      email: doctor.email,

      phoneNumber: doctor.phone_number,

      username: doctor.username,

      gender: doctor.gender,

      age: doctor.age,

      specialization: doctor.specialization,

      education: doctor.education,

      experience: doctor.experience,

      consultationFee: doctor.fee,

      language: parseJSON(doctor.language, []),

      hospitalName: doctor.hospital_name,

      hospitalDetail: parseJSON(
        doctor.hospital_detail,
        []
      ),

      photo: doctor.photo || null

    }));

  } catch (error) {

    console.error(
      "FIND DOCTORS MODEL ERROR:",
      error
    );

    throw error;

  }
};