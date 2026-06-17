const db = require('../config/db');

const getWeeklyAppointmentStats = async (doctorId) => {
  const [rows] = await db.query(
    `
    SELECT
      DAYNAME(slot_date) AS day_name,
      appointment_type,
      COUNT(*) AS total
    FROM appointments
    WHERE doctor_id = ?
      AND YEARWEEK(slot_date, 1) = YEARWEEK(CURDATE(), 1)
    GROUP BY DAYNAME(slot_date), appointment_type
    `,
    [doctorId]
  );

  return rows;
};

const getTodayAppointmentStats = async (doctorId) => {
  const [rows] = await db.query(
    `
    SELECT
      COUNT(*) AS total_appointments,

      SUM(CASE
            WHEN LOWER(status) = 'completed'
            THEN 1 ELSE 0
          END) AS completed,

      SUM(CASE
            WHEN LOWER(status) = 'pending'
            THEN 1 ELSE 0
          END) AS pending,

      SUM(CASE
            WHEN LOWER(status) = 'cancelled'
            THEN 1 ELSE 0
          END) AS cancelled

    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = CURDATE()
    `,
    [doctorId]
  );

  return rows[0];
};


module.exports = {
  getWeeklyAppointmentStats,
   getTodayAppointmentStats
};