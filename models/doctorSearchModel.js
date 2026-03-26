const db = require("../config/db"); 

const parseJSON = (value, fallback = []) => {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value.replace(/[\[\]"]/g, "").split(",").map(v => v.trim());
    }
  }
  return value;
};

exports.findDoctors = async (filters = {}) => {
  let sql = "SELECT * FROM doctors WHERE 1=1";
  const params = [];

  if (filters.name) {
    sql += " AND username LIKE ?";
    params.push(`%${filters.name}%`);
  }

  if (filters.specialization) {
    sql += " AND specialization LIKE ?";
    params.push(`%${filters.specialization}%`);
  }

  if (filters.experience) {
    sql += " AND experience = ?";
    params.push(filters.experience);
  }

  if (filters.consultationFee) {
    sql += " AND consultation_fee <= ?";
    params.push(filters.consultationFee);
  }

  const [rows] = await db.execute(sql, params);

  return rows.map(doc => ({
    id: doc.id,
    userId: doc.user_id,
    username: doc.username,
    specialization: doc.specialization,
    qualification: doc.qualification,
    experience: doc.experience,
    language: parseJSON(doc.language),
    consultationFee: doc.consultation_fee,
    medicalLicenseNo: doc.medical_license_no,
    bio: doc.bio
  }));
};
