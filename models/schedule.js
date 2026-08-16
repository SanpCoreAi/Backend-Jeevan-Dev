const db = require("../config/db");


exports.createSchedule = async (data) => {
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
      note
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.note ?? null
  ]);

  return res.insertId;
};


exports.getAllByDoctor = async (
  doctorId,
  limit,
  offset
) => {

  const [rows] = await db.query(
    `
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

    ORDER BY s.id DESC

    LIMIT ? OFFSET ?
    `,
    [
      doctorId,
      Number(limit),
      Number(offset)
    ]
  );

  return rows.map(parseActiveDays);
};


exports.getAllCountByDoctor = async (
  doctorId
) => {

  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total

    FROM schedules

    WHERE doctor_id = ?
    `,
    [doctorId]
  );

  return Number(rows[0]?.total || 0);
};


exports.findOverlappingSchedule = async (
  data
) => {

  const [rows] = await db.query(
    `
    SELECT id

    FROM schedules

    WHERE doctor_id = ?

      AND (
        (? IS NULL AND hospital_name IS NULL)
        OR hospital_name = ?
      )

      AND (
        start_time < ?
        AND end_time > ?
      )

      AND (
        start_date <= ?
        AND end_date >= ?
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
};


exports.getPublicScheduleByDoctor = async (
  doctorId,
  limit,
  offset
) => {

  const [rows] = await db.query(
    `
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

      AND LOWER(s.status) = 'active'

      AND s.end_date >= CURDATE()

    ORDER BY
      s.start_date ASC,
      s.id DESC

    LIMIT ? OFFSET ?
    `,
    [
      doctorId,
      Number(limit),
      Number(offset)
    ]
  );

  return rows.map(parseActiveDays);
};


exports.getPublicScheduleCountByDoctor = async (
  doctorId
) => {

  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total

    FROM schedules

    WHERE doctor_id = ?

      AND LOWER(status) = 'active'

      AND end_date >= CURDATE()
    `,
    [doctorId]
  );

  return Number(
    rows[0]?.total || 0
  );
};


exports.getScheduleCountByDoctor = async (
  doctorId
) => {

  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS total

    FROM schedules

    WHERE doctor_id = ?

      AND end_date >= CURDATE()
    `,
    [doctorId]
  );

  return Number(
    rows[0]?.total || 0
  );
};


exports.getScheduleByDoctor = async (
  doctorId,
  limit = 0,
  offset = 0
) => {

  try {

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

      ORDER BY
        s.start_date ASC,
        s.id DESC
    `;

    const params = [
      doctorId
    ];

    if (Number(limit) > 0) {

      sql += `
        LIMIT ? OFFSET ?
      `;

      params.push(
        Number(limit),
        Number(offset)
      );
    }

    const [rows] =
      await db.query(
        sql,
        params
      );

    for (const schedule of rows) {

      const [slots] =
        await db.query(
          `
          SELECT
            id,
            schedule_id,
            token_number,
            start_time,
            end_time,
            status

          FROM schedule_slots

          WHERE schedule_id = ?

          ORDER BY
            start_time ASC,
            id ASC
          `,
          [schedule.id]
        );

      schedule.slots = slots;
    }

    return rows.map(
      parseActiveDays
    );

  } catch (error) {

    console.error(
      "Get Schedule By Doctor Model Error:",
      error
    );

    throw error;
  }
};


exports.findOverlappingScheduleForUpdate =
  async (data) => {

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
  };


exports.getSchedulePublicByDoctorId =
  async (doctorId) => {

    return exports.getPublicScheduleByDoctor(
      doctorId,
      0,
      0
    );
  };


exports.deleteActiveSlots = async (
  doctorId,
  scheduleId,
  connection = db
) => {

  const [result] =
    await connection.query(
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
};



exports.update = async (
  doctorId,
  scheduleId,
  body
) => {

  let activeDaysValue =
    body.active_days;

  if (
    Array.isArray(activeDaysValue) ||
    typeof activeDaysValue === "object"
  ) {

    try {

      activeDaysValue =
        JSON.stringify(
          activeDaysValue || []
        );

    } catch (e) {

      activeDaysValue =
        "" +
        (activeDaysValue || "");
    }
  }

  const [result] =
    await db.query(
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
};


// ======================================================
// DELETE SCHEDULE
// ======================================================

exports.remove = async (
  id,
  doctorId
) => {

  const [res] =
    await db.query(
      `
      DELETE FROM schedules

      WHERE id = ?

        AND doctor_id = ?
      `,
      [
        id,
        doctorId
      ]
    );

  return res.affectedRows > 0;
};


exports.deleteByScheduleId =
  async (scheduleId) => {

    const [res] =
      await db.query(
        `
        DELETE FROM schedule_slots

        WHERE schedule_id = ?
        `,
        [scheduleId]
      );

    return res.affectedRows;
  };


function parseActiveDays(row) {

  let active_days =
    row.active_days;

  if (
    typeof active_days === "string"
  ) {

    try {

      active_days =
        JSON.parse(active_days);

    } catch {

      active_days =
        active_days
          .split(",")
          .map(
            (day) =>
              day.trim()
          );
    }
  }

  const dayNames = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  if (
    Array.isArray(active_days)
  ) {

    active_days =
      active_days.map((day) => {

        if (
          typeof day === "number"
        ) {
          return (
            dayNames[day] ??
            String(day)
          );
        }

        if (
          /^\d+$/.test(
            String(day)
          )
        ) {

          return (
            dayNames[
              Number(day)
            ] ??
            String(day)
          );
        }

        const value =
          String(day)
            .trim();

        return (
          value
            .slice(0, 3)
            .charAt(0)
            .toUpperCase() +
          value
            .slice(1, 3)
            .toLowerCase()
        );
      });
  }

  return {
    ...row,

    active_days:
      active_days || []
  };
}