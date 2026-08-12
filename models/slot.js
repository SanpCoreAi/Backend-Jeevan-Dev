const db = require("../config/db");

async function insertSlots(
  slots,
  connection = db
) {
  if (
    !Array.isArray(slots) ||
    slots.length === 0
  ) {
    return 0;
  }

  const values = slots.map((s) => [
    s.schedule_id,
    s.doctor_id,
    s.start_date,
    s.end_date,
    s.status || "active",
    formatTime(s.start_time),
    formatTime(s.end_time),
    s.token_number
  ]);

  const sql = `
    INSERT INTO schedule_slots
    (
      schedule_id,
      doctor_id,
      start_date,
      end_date,
      status,
      start_time,
      end_time,
      token_number
    )
    VALUES ?
  `;

  const [result] = await connection.query(
    sql,
    [values]
  );

  const firstInsertId = result.insertId;

  if (!firstInsertId || result.affectedRows !== slots.length) {
    return [];
  }

  return slots.map((slot, index) => ({
    id: firstInsertId + index,
    schedule_id: slot.schedule_id,
    doctor_id: slot.doctor_id,
    start_date: slot.start_date,
    end_date: slot.end_date,
    status: slot.status || "active",
    start_time: formatTime(slot.start_time),
    end_time: formatTime(slot.end_time),
    token_number: slot.token_number
  }));
}

function formatTime(time) {
  if (!time) {
    return null;
  }

  return time.length === 5
    ? time + ":00"
    : time;
}

async function getActiveSlot(
  scheduleId,
  doctorId,
  slotDate,
  startTime
) {
  if (
    !scheduleId ||
    !startTime ||
    !slotDate
  ) {
    return null;
  }

  const formattedStartTime =
    formatTime(startTime);

  const [rows] = await db.query(
    `
    SELECT *
    FROM schedule_slots
    WHERE schedule_id = ?
      AND doctor_id = ?
      AND start_date = ?
      AND start_time = ?
      AND status = 'active'
    LIMIT 1
    `,
    [
      scheduleId,
      doctorId,
      slotDate,
      formattedStartTime
    ]
  );

  return rows[0] || null;
}

async function deactivateSlot(slotId) {
  await db.query(
    `
    UPDATE schedule_slots
    SET status = 'inactive'
    WHERE id = ?
    `,
    [slotId]
  );
}

async function getNextAvailableSlot(
  doctorId
) {
  if (!doctorId) {
    return null;
  }

  const [rows] = await db.query(
    `
    SELECT *
    FROM schedule_slots
    WHERE doctor_id = ?
      AND status = 'active'
      AND start_date >= CURDATE()
    ORDER BY start_date ASC, start_time ASC
    LIMIT 1
    `,
    [doctorId]
  );

  return rows[0] || null;
}

async function getDoctorSlots(
  doctorId,
  hospitalName,
  date
) {
  const [rows] = await db.query(
    `
    SELECT
      ss.id,
      ss.schedule_id,
      ss.doctor_id,
      ss.start_date,
      ss.end_date,
      ss.start_time,
      ss.end_time,
      ss.token_number,
      ss.status,
      s.hospital_name,

      (
        SELECT COUNT(*)
        FROM schedule_slots s2
        WHERE s2.schedule_id = ss.schedule_id
          AND LOWER(s2.status) = 'inactive'
      ) AS booking_length

    FROM schedule_slots ss

    INNER JOIN schedules s
      ON s.id = ss.schedule_id

    WHERE ss.doctor_id = ?
      AND s.hospital_name = ?
      AND ss.start_date = ?

    ORDER BY ss.start_time ASC
    `,
    [
      doctorId,
      hospitalName,
      date
    ]
  );

  return rows;
}


async function getSlotsBySchedule(
  scheduleId,
  connection = db
) {
  if (!scheduleId) {
    return [];
  }

  const [rows] = await connection.query(
    `
    SELECT
      id,
      schedule_id,
      doctor_id,
      start_date,
      end_date,
      start_time,
      end_time,
      token_number,
      status
    FROM schedule_slots
    WHERE schedule_id = ?
    ORDER BY start_date ASC, start_time ASC
    `,
    [scheduleId]
  );

  return rows;
}

async function getSlotsByDate(
  scheduleId,
  date,
  connection = db
) {
  const [rows] = await connection.query(
    `
    SELECT
      id,
      schedule_id,
      doctor_id,
      status,
      start_date,
      end_date,
      start_time,
      end_time,
      token_number
    FROM schedule_slots
    WHERE schedule_id = ?
      AND DATE(start_date) = DATE(?)
    ORDER BY start_time ASC
    `,
    [
      scheduleId,
      date
    ]
  );

  return rows;
}

async function deleteCompleteSchedule(
  { doctorId, scheduleId },
  connection = db
) {
  await connection.query(
    `
    DELETE FROM schedule_slots
    WHERE doctor_id = ?
      AND schedule_id = ?
    `,
    [
      doctorId,
      scheduleId
    ]
  );

  const [result] = await connection.query(
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


async function deleteSlotsByDate(
  { doctorId, scheduleId, date },
  connection = db
) {
  const [result] = await connection.query(
    `
    DELETE FROM schedule_slots
    WHERE doctor_id = ?
      AND schedule_id = ?
      AND DATE(start_date) = ?
    `,
    [
      doctorId,
      scheduleId,
      date
    ]
  );

  return result;
}


async function insertTokens(
  tokens,
  connection = db
) {
  if (
    !Array.isArray(tokens) ||
    tokens.length === 0
  ) {
    return 0;
  }
  return tokens.length;
}


async function deleteSingleSlot(
  { doctorId, scheduleId, slotId },
  connection = db
) {
  const [result] = await connection.query(
    `
    DELETE FROM schedule_slots
    WHERE id = ?
      AND doctor_id = ?
      AND schedule_id = ?
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
  insertTokens,
  getActiveSlot,
  getDoctorSlots,
  getSlotsBySchedule,
  deactivateSlot,
  getSlotsByDate,
  deleteCompleteSchedule,
  deleteSlotsByDate,
  deleteSingleSlot,
  getNextAvailableSlot
};