const db = require("../config/db");

class DoctorRatingModel {

  static async getDoctorWithRating(doctorId) {
    const sql = `
      SELECT 
        d.*,
        COUNT(f.rating) AS total_ratings,
        ROUND(AVG(f.rating), 1) AS avg_rating
      FROM doctors d
      LEFT JOIN feedbacks f 
        ON f.doctor_id = d.id
      WHERE d.id = ?
      GROUP BY d.id
    `;

    const [rows] = await db.execute(sql, [doctorId]);
    return rows[0];
  }
}

module.exports = DoctorRatingModel;
