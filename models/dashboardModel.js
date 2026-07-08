const db = require('../config/db');

const getCondition = (params = {}, column = "created_at") => {
  const { filter, startDate, endDate } = params;

  if (startDate && endDate) {
    return {
      condition: `DATE(${column}) BETWEEN ? AND ?,
      values: [startDate, endDate]`,
    };
  }

  switch (filter) {
    case "today":
      return {
        condition: `DATE(${column}) = CURDATE()`,
        values: [],
      };

    case "week":
      return {
        condition:` YEARWEEK(${column},1)=YEARWEEK(CURDATE(),1),
        values: []`,
      };

    case "month":
      return {
        condition: `MONTH(${column})=MONTH(CURDATE()) AND YEAR(${column})=YEAR(CURDATE())`,
        values: [],
      };

    case "year":
      return {
        condition:` YEAR(${column})=YEAR(CURDATE()),
        values: []`,
      };

    default:
      return {
        condition: "1=1",
        values: [],
      };
  }
};

const getPatientsCount = async (params) => {
  const { condition, values } = getCondition(params);

  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM users
     WHERE role_id = 1
     AND ${condition}`,
    values
  );

  return rows[0].total;
};
const getDoctorsCount = async (params) => {
  const { condition, values } = getCondition(params);

  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM users
     WHERE role_id = 2
     AND ${condition}`,
    values
  );

  return rows[0].total;
};

const getAssistantsCount = async (params) => {
  const { condition, values } = getCondition(params);

  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM users
     WHERE role_id = 3
     AND ${condition}`,
    values
  );

  return rows[0].total;
};

const getCompletedAppointmentsCount = async (params) => {
  const { condition, values } = getCondition(params);

  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM appointments
     WHERE LOWER(status) = 'completed'
     AND ${condition}`,
    values
  );

  return rows[0].total;
};

const getUpcomingAppointmentsCount = async (params) => {
  const { condition, values } = getCondition(params, "slot_date");

  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE DATE(slot_date) >= CURDATE()
      AND ${condition}
    `,
    values
  );

  return rows[0].total;
};

const getPastAppointmentsCount = async (params) => {
  const { condition, values } = getCondition(params, "slot_date");

  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE DATE(slot_date) < CURDATE()
      AND ${condition}
    `,
    values
  );

  return rows[0].total;
};
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
  getPatientsCount,
  getDoctorsCount,
  getAssistantsCount,
   getCompletedAppointmentsCount,
  getUpcomingAppointmentsCount,
  getPastAppointmentsCount,
  getWeeklyAppointmentStats,
  getTodayAppointmentStats,
};