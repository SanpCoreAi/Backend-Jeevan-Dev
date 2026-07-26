const db = require("../config/db");

exports.getDoctorWithRating = async (doctorId) => {
  const sql = `
    SELECT
      d.id,
      d.user_id,
      d.username,
      d.specialization,
      d.qualification,
      d.experience,
      d.consultation_fee,
      d.medical_license_no,
      d.bio,
      d.age,
      d.gender,
      d.language,
      d.availability,
      d.hospital_detail,
      d.qr_code,
      COALESCE(
        ROUND(AVG(f.rating), 1),
        0
      ) AS avg_rating,
      COUNT(f.rating) AS total_ratings,
      COALESCE(
        SUM(
          CASE
            WHEN f.rating > 3
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS positive_feedbacks,
      COALESCE(
        SUM(
          CASE
            WHEN f.rating <= 3
            THEN 1
            ELSE 0
          END
        ),
        0
      ) AS negative_feedbacks

    FROM doctors d
    LEFT JOIN feedbacks f
      ON f.doctor_id = d.user_id
    WHERE d.user_id = ?
    GROUP BY
      d.id,
      d.user_id,
      d.username,
      d.specialization,
      d.qualification,
      d.experience,
      d.consultation_fee,
      d.medical_license_no,
      d.bio,
      d.age,
      d.gender,
      d.language,
      d.availability,
      d.hospital_detail,
      d.qr_code

    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [doctorId]);

  return rows.length ? rows[0] : null;
};