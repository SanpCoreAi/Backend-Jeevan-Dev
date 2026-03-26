const db = require("../config/db");

async function createSchedule(data) {
  const sql = `
    INSERT INTO schedules
    (
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
      note
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [res] = await db.query(sql, [
    data.doctor_id,
    data.location_id,
    data.hospital_name,
    data.start_time,
    data.end_time,
    data.slot_duration,
    data.break_minutes,
    JSON.stringify(data.active_days || []),
    data.start_date,
    data.end_date,
    data.note
  ]);

  return res.insertId;
}



// async function getAllByDoctor(doctorId) {
//   const [rows] = await db.query(
//     `SELECT * FROM schedules WHERE doctor_id=? ORDER BY id DESC`,
//     [doctorId]
//   );

//   return rows.map(r => ({
//     ...r,
//     active_days: r.active_days ? JSON.parse(r.active_days) : []
//   }));
// }

async function getAllByDoctor(doctorId) {
  const [rows] = await db.query(
    `SELECT * FROM schedules WHERE doctor_id=? ORDER BY id DESC`,
    [doctorId]
  );

  return rows.map(r => {
    let active_days = r.active_days;

    // ✅ SAFE handling (JSON + CSV dono)
    if (typeof active_days === "string") {
      try {
        active_days = JSON.parse(active_days);
      } catch {
        active_days = active_days
          .split(",")
          .map(d => d.trim());
      }
    }

    if (!Array.isArray(active_days)) {
      active_days = [];
    }

    return {
      ...r,
      active_days
    };
  });
}


async function findOverlappingSchedule(data) {
  const [rows] = await db.query(
    `
    SELECT id FROM schedules
    WHERE doctor_id = ?
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
      data.end_time,
      data.start_time,
      data.end_date,
      data.start_date
    ]
  );

  return rows.length > 0;
}


async function getScheduleByDoctor(doctorId) {
  const [rows] = await db.query(
    `SELECT * FROM schedules WHERE doctor_id = ?`,
    [doctorId]
  );

  return rows.map(schedule => {
    let active_days = schedule.active_days;

    if (typeof active_days === "string") {
      try {
        active_days = JSON.parse(active_days);
      } catch {
        active_days = active_days.split(",").map(d => d.trim());
      }
    }

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    if (Array.isArray(active_days)) {
      active_days = active_days.map(d => {
        if (typeof d === 'number') return dayNames[d] ?? String(d);
        if (/^\d+$/.test(String(d))) return dayNames[Number(d)] ?? String(d);
        const s = String(d).trim();
        return s.slice(0,3).charAt(0).toUpperCase() + s.slice(1,3).toLowerCase();
      });
    }

    return {
      ...schedule,
      active_days: active_days || []
    };
  });
};

async function getSchedulePublicByDoctorId(doctorId) {
  return getScheduleByDoctor(doctorId);
}

async function update(doctorId, scheduleId, data) {
  const [res] = await db.query(
    `UPDATE schedules SET
      location_id=?,
      hospital_name=?,
      start_time=?,
      end_time=?,
      slot_duration=?,
      break_minutes=?,
      active_days=?,
      start_date=?,
      end_date=?,
      note=?
     WHERE doctor_id=? AND id=?`,
    [
      data.location_id ?? null,
      data.hospital_name ?? null,
      data.start_time ?? null,
      data.end_time ?? null,
      data.slot_duration ?? null,
      data.break_minutes ?? 0,
      JSON.stringify(Array.isArray(data.active_days) ? data.active_days : []),
      data.start_date ?? null,
      data.end_date ?? null,
      data.note ?? null,
      doctorId,
      scheduleId
    ]
  );

  return res.affectedRows > 0;
}




async function remove(id, doctorId) {
  const [res] = await db.query(
    `DELETE FROM schedules WHERE id=? AND doctor_id=?`,
    [id, doctorId]
  );
  return res.affectedRows > 0;
}

module.exports = {
  createSchedule,
  getAllByDoctor,
  getScheduleByDoctor,
  getSchedulePublicByDoctorId,
  update,
  remove,
  findOverlappingSchedule
};
