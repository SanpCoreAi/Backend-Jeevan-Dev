const db = require("../config/db");

async function createSchedule(data) {
  const sql = `
    INSERT INTO schedules (
      doctor_id,
      location_id,
      hospital_name,
      start_time,
      end_time,
      slot_duration,
      break_minutes,
      active_days,
      start_date,
      end_date,
      note,
      offlinepatient_number
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [res] = await db.query(sql, [
    data.doctor_id,
    data.location_id,
    data.hospital_name ?? null,
    data.start_time,
    data.end_time,
    data.slot_duration,
    data.break_minutes ?? 0,
    JSON.stringify(data.active_days || []),
    data.start_date,
    data.end_date,
    data.note ?? null,
    data.offlinepatient_number ?? null
  ]);

  return res.insertId;
}

// ✅ Get all schedules
async function getAllByDoctor(doctorId) {
  const [rows] = await db.query(
    `SELECT * FROM schedules WHERE doctor_id=? ORDER BY id DESC`,
    [doctorId]
  );

  return rows.map(parseActiveDays);
}

// ✅ Hospital-wise duplicate + overlap check
async function findOverlappingSchedule(data) {
  const [rows] = await db.query(
    `
    SELECT id FROM schedules
    WHERE doctor_id = ?

      AND (
        (? IS NULL AND hospital_name IS NULL)
        OR hospital_name = ?
      )

      AND (
        (start_time < ? AND end_time > ?)
      )

      AND (
        (start_date <= ? AND end_date >= ?)
      )

    LIMIT 1
    `,
    [
      data.doctor_id,
      data.hospital_name,
      data.hospital_name,
      data.end_time,
      data.start_time,
      data.end_date,
      data.start_date
    ]
  );

  return rows.length > 0;
}

async function getScheduleCountByDoctor(doctorId) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM schedules
    WHERE doctor_id = ?
      AND end_date >= CURDATE()
    `,
    [doctorId]
  );

  return rows[0].total;
}

async function getScheduleByDoctor(doctorId, limit = 0, offset = 0) {
  let sql = `
    SELECT
      s.*,
      (
        SELECT COUNT(*)
        FROM schedule_slots ss
        WHERE ss.schedule_id = s.id
          AND LOWER(ss.status) = 'inactive'
      ) AS booking_length
    FROM schedules s
    WHERE s.doctor_id = ?
      AND s.end_date >= CURDATE()
    ORDER BY s.start_date ASC, s.id DESC
  `;
  const params = [doctorId];

  if (Number(limit) > 0) {
    sql += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
  }

  const [rows] = await db.query(sql, params);

  return rows.map(parseActiveDays);
}

async function findOverlappingScheduleForUpdate(data) {

  const [rows] = await db.query(
    `
    SELECT id
    FROM schedules
    WHERE doctor_id = ?
      AND id <> ?

      AND (
            (? IS NULL AND hospital_name IS NULL)
            OR hospital_name = ?
      )

      AND start_time < ?
      AND end_time > ?

      AND start_date <= ?
      AND end_date >= ?

    LIMIT 1
    `,
    [
      data.doctor_id,
      data.schedule_id,
      data.hospital_name,
      data.hospital_name,
      data.end_time,
      data.start_time,
      data.end_date,
      data.start_date
    ]
  );

  return rows.length > 0;
}

async function getSchedulePublicByDoctorId(doctorId) {
  return getScheduleByDoctor(doctorId);
}

async function deleteActiveSlots(doctorId, scheduleId) {

  const [result] = await db.query(
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

  return result;
}

async function update(doctorId, scheduleId, body) {

  // Ensure active_days is stored as a JSON string to avoid SQL syntax issues
  let activeDaysValue = body.active_days;

  if (Array.isArray(activeDaysValue) || typeof activeDaysValue === 'object') {
    try {
      activeDaysValue = JSON.stringify(activeDaysValue || []);
    } catch (e) {
      activeDaysValue = '' + (activeDaysValue || '');
    }
  }

  const [result] = await db.query(
    `
    UPDATE schedules
    SET
      location_id = ?,
      hospital_name = ?,
      start_time = ?,
      end_time = ?,
      slot_duration = ?,
      break_minutes = ?,
      active_days = ?,
      start_date = ?,
      end_date = ?,
      note = ?
    WHERE id = ?
      AND doctor_id = ?
    `,
    [
      body.location_id,
      body.hospital_name,
      body.start_time,
      body.end_time,
      body.slot_duration,
      body.break_minutes,
      activeDaysValue,
      body.start_date,
      body.end_date,
      body.note,
      scheduleId,
      doctorId
    ]
  );

  return result.affectedRows > 0;
}


async function remove(id, doctorId) {
  const [res] = await db.query(
    `DELETE FROM schedules WHERE id=? AND doctor_id=?`,
    [id, doctorId]
  );

  return res.affectedRows > 0;
}

async function deleteByScheduleId(scheduleId) {
  const [res] = await db.query(
    `DELETE FROM schedule_slots WHERE schedule_id = ?`,
    [scheduleId]
  );

  return res.affectedRows;
}

function parseActiveDays(r) {
  let active_days = r.active_days;

  if (typeof active_days === "string") {
    try {
      active_days = JSON.parse(active_days);
    } catch {
      active_days = active_days.split(",").map(d => d.trim());
    }
  }

  return {
    ...r,
    active_days
  };


  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  if (Array.isArray(active_days)) {
    active_days = active_days.map(d => {
      if (typeof d === "number") return dayNames[d] ?? String(d);
      if (/^\d+$/.test(String(d))) return dayNames[Number(d)] ?? String(d);

      const s = String(d).trim();
      return s.slice(0,3).charAt(0).toUpperCase() + s.slice(1,3).toLowerCase();
    });
  }

  return {
    ...r,
    active_days: active_days || []
  };
}

module.exports = {
  createSchedule,
  getAllByDoctor,
  getScheduleByDoctor,
  getSchedulePublicByDoctorId,
  // getSlotsByScheduleId,
  findOverlappingScheduleForUpdate,
  deleteByScheduleId,
  update,
  deleteActiveSlots,
  getScheduleCountByDoctor,
  remove,
  findOverlappingSchedule
};