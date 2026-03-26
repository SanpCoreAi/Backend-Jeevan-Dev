const db = require("../config/db");
const AppError = require("../utils/appError");

// Get all doctors (users with role_id = 2) along with their doctor details
exports.getDoctorsByRole = async () => {
  try {
    const sql = `
      SELECT 
        u.id as user_id,
        u.full_name as name,
        u.email,
        u.phone_number as mobile,
        u.role_id,
        u.doctor_id,
        d.id as doctor_table_id,
        d.username,
        d.specialization,
        d.qualification,
        d.experience,
        d.language,
        d.consultationFee,
        d.medicalLicenseNo,
        d.address,
        d.hospitalName,
        d.bio,
        d.license_file,
        d.created_at as doctor_created_at
      FROM users u
      LEFT JOIN doctors d ON u.id = d.doctor_id
      WHERE u.role_id = 2
      ORDER BY u.id DESC
    `;

    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    console.error("Database Error (getDoctorsByRole):", err);
    throw new AppError("Database query failed while fetching doctors by role.", 500);
  }
};
