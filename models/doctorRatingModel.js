const db = require("../config/db");

exports.getDoctorWithRating = async (doctorId) => {
  try {
    const sql = `
      SELECT

        -- users
        u.registration_id,

        -- doctor_registrations
        dr.full_name,
        dr.gender,
        dr.age,
        dr.email,
        dr.mobile,
        dr.medical_registration_number,
        dr.medical_council,
        dr.qualification,
        dr.specialization,
        dr.onboarding_status,
        dr.selfie,

        -- doctors
        d.id AS doctor_id,
        d.user_id,
        d.experience,
        d.language,
        d.consultation_fee,
        d.bio,
        d.availability,
        d.hospital_detail,
        d.qr_url,
        d.accept_emergency_patients,

        -- ratings
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

      INNER JOIN users u
        ON u.id = d.user_id

      LEFT JOIN doctor_registrations dr
        ON dr.id = u.registration_id

      LEFT JOIN feedbacks f
        ON f.doctor_id = d.user_id

      WHERE d.user_id = ?

      GROUP BY

        u.registration_id,

        dr.full_name,
        dr.gender,
        dr.age,
        dr.email,
        dr.mobile,
        dr.medical_registration_number,
        dr.medical_council,
        dr.qualification,
        dr.specialization,
        dr.onboarding_status,
        dr.selfie,

        d.id,
        d.user_id,
        d.experience,
        d.language,
        d.consultation_fee,
        d.bio,
        d.availability,
        d.hospital_detail,
        d.qr_url,
        d.accept_emergency_patients

      LIMIT 1
    `;

    const [rows] =
      await db.execute(
        sql,
        [doctorId]
      );

    return rows.length
      ? rows[0]
      : null;

  } catch (error) {

    console.error(
      "GET DOCTOR WITH RATING MODEL ERROR:",
      error
    );

    throw error;
  }
};