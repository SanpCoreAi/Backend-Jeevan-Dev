const db = require("../config/db");

async function insertSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return;
  console.log("Slot Data:", slots);

  const values = slots.map(s => [
    s.schedule_id,
    s.doctor_id,
    s.start_date,
    s.end_date,
    s.status || "active",
    formatTime(s.start_time),
    formatTime(s.end_time)
  ]);

  await db.query(
    `INSERT INTO schedule_slots
     (schedule_id, doctor_id, start_date, end_date, status, start_time, end_time)
     VALUES ?`,
    [values]
  );
}

function formatTime(time) {
  if (!time) return null;
  return time.length === 5 ? time + ":00" : time;
}

async function getActiveSlot(scheduleId, doctorId, slotDate, startTime) {
  if (!scheduleId || !startTime || !slotDate) return null;

  const formattedStartTime = formatTime(startTime);

  const [rows] = await db.query(
    `SELECT *
     FROM schedule_slots
     WHERE schedule_id = ?
       AND doctor_id = ?
       AND start_date = ?
       AND start_time = ?
       AND status = 'active'
     LIMIT 1`,
    [scheduleId, doctorId, slotDate, formattedStartTime]
  );

  return rows[0] || null;
}

async function deactivateSlot(slotId) {
  await db.query(
    `UPDATE schedule_slots
     SET status = 'inactive'
     WHERE id = ?`,
    [slotId]
  );
}

async function getNextAvailableSlot(doctorId) {

  if (!doctorId) return null;

  const [rows] = await db.query(
    `SELECT *
     FROM schedule_slots
     WHERE doctor_id = ?
     AND status = 'active'
     AND start_date >= CURDATE()
     ORDER BY start_date ASC, start_time ASC
     LIMIT 1`,
    [doctorId]
  );

  return rows[0] || null;
}

async function getDoctorSlots(doctorId, hospitalName, date) {

  const [rows] = await db.query(
    `
    SELECT
      ss.id,
      ss.start_time,
      ss.end_time,
      ss.status,
      s.hospital_name
    FROM schedule_slots ss
    INNER JOIN schedules s
      ON s.id = ss.schedule_id
    WHERE ss.doctor_id = ?
      AND s.hospital_name = ?
      AND DATE(CONVERT_TZ(ss.start_date, '+00:00', '+05:30')) >= ?
    ORDER BY
      DATE(CONVERT_TZ(ss.start_date, '+00:00', '+05:30')) ASC,
      ss.start_time ASC
    `,
    [doctorId, hospitalName, date]
  );

  return rows;
}

async function deleteCompleteSchedule({
  doctorId,
  scheduleId
}) {

  // Delete only ACTIVE slots
  await db.query(
    `
    DELETE FROM schedule_slots
    WHERE doctor_id = ?
      AND schedule_id = ?
      AND LOWER(status) = 'active'
    `,
    [
      doctorId,
      scheduleId
    ]
  );

  // Delete schedule
  const [result] = await db.query(
    `
    DELETE FROM schedules
    WHERE id = ?
      AND doctor_id = ?
    `,
    [
      scheduleId,
      doctorId
    ]
  );

  return result;
}


async function deleteSlotsByDate({
  doctorId,
  scheduleId,
  date,
  bookedSlots = []
}) {

  let sql = `
    DELETE FROM schedule_slots
    WHERE doctor_id = ?
      AND schedule_id = ?
      AND DATE(start_date) = ?
      AND LOWER(status) = 'active'
  `;

  const params = [
    doctorId,
    scheduleId,
    date
  ];

  // Agar bookedSlots use karna ho
  if (bookedSlots.length > 0) {
    sql += ` AND id NOT IN (${bookedSlots.map(() => "?").join(",")})`;
    params.push(...bookedSlots);
  }

  const [result] = await db.query(sql, params);

  return result;
}

async function deleteSingleSlot({
  doctorId,
  scheduleId,
  slotId
}) {

  const [result] = await db.query(
    `
    DELETE FROM schedule_slots
    WHERE id = ?
      AND doctor_id = ?
      AND schedule_id = ?
      AND LOWER(status) = 'active'
    `,
    [
      slotId,
      doctorId,
      scheduleId
    ]
  );

  return result;
}


module.exports = {
  insertSlots,
  getActiveSlot,
  getDoctorSlots,
  deactivateSlot,
  deleteCompleteSchedule,
  deleteSlotsByDate,
  deleteSingleSlot,
  getNextAvailableSlot
};