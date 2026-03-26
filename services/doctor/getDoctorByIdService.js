const db = require("../../config/db");
const AppError = require("../../utils/appError");

async function getDoctorByIdService(doctorId) {
  try {
    if (!doctorId) {
      throw new AppError("Doctor ID is required", 400);
    }

    const [rows] = await db.query(
      `SELECT 
        d.id,
        d.doctor_id,
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
        d.created_at,
        u.full_name,
        u.email,
        u.phone_number,
        u.role_id
       FROM doctors d
       LEFT JOIN users u ON d.doctor_id = u.doctor_id
       WHERE d.id = ?`,
      [doctorId]
    );

    if (rows.length === 0) {
      throw new AppError("Doctor not found", 404);
    }

    return rows[0];
  } catch (err) {
    console.error(" Database Error (getDoctorByIdService):", err);
    if (err instanceof AppError) throw err;
    throw new AppError("Database query failed", 500);
  }
}

module.exports = { getDoctorByIdService };
