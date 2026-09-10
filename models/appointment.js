const db = require("../config/db");
const { parse12to24 } = require("../utils/timeHelper");

const normalizeDateOnly = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return null;
  }

  const datePart = rawValue.split("T")[0].split(" ")[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;
};

exports.getConnection = async () => {
  return await db.getConnection();
};

exports.create = async (
  data,
  connection = db
) => {
  const sql = `
    INSERT INTO appointments
    (
      token_number,
      code,
      slot_date,
      start_time,
      end_time,
      patient_id,
      doctor_id,
      schedule_id,
      appointment_type,
      booking_type,
      hospital_name,
      reason_for_visit
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(
    sql,
    [
      data.token_number,
      data.code,
      normalizeDateOnly(data.appointment_date),
      data.start_time,
      data.end_time,
      data.patient_id,
      data.doctor_id,
      data.schedule_id,
      data.mode,
      data.booking_type,
      data.hospital_name,
      data.reason_for_visit
    ]
  );

  return result.insertId;
};

exports.insertOtherPatient = async (
  data,
  connection = db
) => {
  const sql = `
    INSERT INTO appointment_patients
    (
      appointment_id,
      user_id,
      patient_name,
      age,
      gender,
      patient_phone,
      patient_email
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(
    sql,
    [
      data.appointment_id,
      data.user_id,
      data.name,
      data.age,
      data.gender,
      data.phone,
      data.email
    ]
  );

  return result.insertId;
};


exports.countTodayAppointments = async (
  patientId,
  appointmentDate,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE patient_id = ?
      AND DATE(slot_date) = ?
      AND status != 'CANCELLED'
    `,
    [patientId, appointmentDate]
  );

  return Number(rows[0].total);
};


exports.checkCodeExists = async (
  doctorId,
  appointmentDate,
  code,
  connection = db
) => {
  const [rows] = await connection.query(
    `
    SELECT id
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND code = ?
      AND status != 'CANCELLED'
    LIMIT 1
    `,
    [
      doctorId,
      appointmentDate,
      code
    ]
  );

  return rows.length > 0;
};

exports.getNextTokenNumber = async (
  doctorId,
  appointmentDate,
  hospitalName,
  connection = db
) => {
  const sql = `
    SELECT
      COALESCE(MAX(token_number), 0) + 1 AS nextToken
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND LOWER(TRIM(hospital_name)) =
          LOWER(TRIM(?))
      AND status != 'CANCELLED'
  `;

  const [rows] = await connection.query(
    sql,
    [
      doctorId,
      appointmentDate,
      hospitalName
    ]
  );

  return Number(
    rows[0]?.nextToken || 1
  );
};

exports.checkSlotBooked = async (
  doctorId,
  appointmentDate,
  startTime,
  connection = db
) => {
  const [rows] = await connection.query(
    `
    SELECT id
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND start_time = ?
      AND status != 'CANCELLED'
    LIMIT 1
    `,
    [
      doctorId,
      appointmentDate,
      startTime
    ]
  );

  return rows.length > 0;
};

exports.getAppointmentPublicById = async (
  patientId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT *
    FROM appointments
    WHERE patient_id = ?
    ORDER BY id DESC
    `,
    [patientId]
  );

  return rows;
};

exports.getDashboardStats = async (
  doctorId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT

      COUNT(
        CASE
          WHEN DATE(slot_date) = CURDATE()
          THEN 1
        END
      ) AS todayAppointments,

      COUNT(
        CASE
          WHEN DATE(slot_date) = CURDATE()
          AND status = 'COMPLETED'
          THEN 1
        END
      ) AS todayCompleted,

      COUNT(
        CASE
          WHEN DATE(slot_date) = CURDATE()
          AND status = 'CANCELLED'
          THEN 1
        END
      ) AS todayCancelled,

      COUNT(
        CASE
          WHEN DATE(slot_date) > CURDATE()
          THEN 1
        END
      ) AS upcomingAppointments

    FROM appointments
    WHERE doctor_id = ?
    `,
    [doctorId]
  );

  return rows[0];
};

exports.getDoctorAppointmentsForTable = async (
  doctorId,
  hospitalName,
  mode,
  slot_date,
  status,
  limit,
  offset,
  connection = db
) => {

  let query = `
    SELECT

      a.id AS appointment_id,

      a.token_number,

      COALESCE(u.full_name,'Unknown') AS name,

      COALESCE(
        u.phone_number,
        ap.patient_phone
      ) AS phone_number,

      d.specialization AS diagnostic,

      DATE_FORMAT(
        a.slot_date,
        '%d-%m-%Y'
      ) AS date,

      DATE_FORMAT(
        a.start_time,
        '%h:%i %p'
      ) AS time,

      a.appointment_type AS mode,

      COALESCE(
        a.hospital_name,
        'Online'
      ) AS hospital_name,

      a.status,

      DATE_FORMAT(
        a.created_at,
        '%d-%m-%Y %h:%i %p'
      ) AS booked_at

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id

    WHERE a.doctor_id = ?
  `;

  const params = [doctorId];

  if (hospitalName) {
    query += `
      AND LOWER(TRIM(a.hospital_name))
          = LOWER(TRIM(?))
    `;
    params.push(hospitalName);
  }

  if (mode) {
    query += `
      AND LOWER(a.appointment_type)
          = LOWER(?)
    `;
    params.push(mode);
  }

  if (status) {
    query += `
      AND LOWER(a.status)
          = LOWER(?)
    `;
    params.push(status);
  } else {
    query += `
      AND LOWER(a.status)
      IN ('pending','in_progress')
    `;
  }

  if (slot_date) {
    query += `
      AND DATE(a.slot_date) = ?
    `;
    params.push(slot_date);
  }

  query += `
    ORDER BY
      a.slot_date DESC,
      a.start_time ASC,
      a.token_number ASC
    LIMIT ?
    OFFSET ?
  `;

  params.push(
    Number(limit),
    Number(offset)
  );

  const [rows] =
    await connection.query(
      query,
      params
    );

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM appointments a
    WHERE a.doctor_id = ?
  `;

  const countParams = [doctorId];

  if (hospitalName) {
    countQuery += `
      AND LOWER(TRIM(a.hospital_name))
          = LOWER(TRIM(?))
    `;
    countParams.push(hospitalName);
  }

  if (mode) {
    countQuery += `
      AND LOWER(a.appointment_type)
          = LOWER(?)
    `;
    countParams.push(mode);
  }

  if (status) {
    countQuery += `
      AND LOWER(a.status)
          = LOWER(?)
    `;
    countParams.push(status);
  } else {
    countQuery += `
      AND LOWER(a.status)
      IN ('pending','in_progress')
    `;
  }

  if (slot_date) {
    countQuery += `
      AND DATE(a.slot_date) = ?
    `;
    countParams.push(slot_date);
  }

  const [[countResult]] =
    await connection.query(
      countQuery,
      countParams
    );

  return {
    rows,
    total: countResult.total
  };
};

exports.getAppointmentForCancel = async (
  appointmentId,
  patientId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      id,
      patient_id,
      doctor_id,
      schedule_id,
      slot_date,
      start_time,
      end_time,
      token_number,
      status,
      hospital_name
    FROM appointments
    WHERE id = ?
      AND patient_id = ?
    LIMIT 1
    FOR UPDATE
    `,
    [
      appointmentId,
      patientId
    ]
  );

  return rows[0] || null;
};

exports.cancelAppointment = async (
  appointmentId,
  reason,
  connection = db
) => {

  const [result] =
    await connection.query(
      `
      UPDATE appointments
      SET
        status = 'CANCELLED',
        cancel_reason = ?,
        updated_at = NOW()
      WHERE id = ?
        AND status <> 'CANCELLED'
      `,
      [
        reason,
        appointmentId
      ]
    );

  return result.affectedRows === 1;
};

exports.autoCancelPendingAppointments = async (
  connection = db
) => {

  const [result] =
    await connection.query(
      `
      UPDATE appointments
      SET
        status = 'CANCELLED',
        updated_at = NOW()
      WHERE status = 'PENDING'
        AND DATE(slot_date) < CURDATE()
      `
    );

  console.log(
    `Auto Cancelled Appointments: ${result.affectedRows}`
  );

  return result;
};

exports.getAppointmentById = async (
  doctorId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.id AS appointment_id,

      COALESCE(u.full_name, 'Unknown') AS name,
      u.phone_number AS phone,
      u.email,

      up.gender AS sex,
      up.age,
      up.weight,
      up.height,
      up.blood_group,

      a.token_number,
      a.appointment_type AS mode,
      a.hospital_name,

      DATE_FORMAT(a.slot_date, '%d %b %Y') AS visit_date,

      d.specialization AS diagnosis,

      'Paid' AS payment_status,
      'New' AS visit_type,
      'Fever' AS diagnosis_text,
      'Feeling unwell due to fever; resting and monitoring symptoms.' AS note

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN (
      SELECT up1.*
      FROM user_profiles up1
      INNER JOIN (
        SELECT
          user_id,
          MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
      ) latest
      ON up1.id = latest.max_id
    ) up
      ON up.user_id = u.id

    LEFT JOIN doctors d
      ON d.id = a.doctor_id

    WHERE a.doctor_id = ?

    ORDER BY a.id DESC
    `,
    [doctorId]
  );

  return rows;
};

exports.countTodayAppointments = async (
  patientId,
  appointmentDate,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      COUNT(*) AS total
    FROM appointments
    WHERE patient_id = ?
      AND DATE(slot_date) = ?
      AND status <> 'CANCELLED'
    `,
    [
      patientId,
      appointmentDate
    ]
  );

  return Number(rows[0].total);
};


exports.getByIdAndPatient = async (
  patientId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.*
    FROM appointments a

    INNER JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE ap.user_id = ?

    ORDER BY a.id DESC
    `,
    [patientId]
  );

  return rows;
};


exports.activateSlot = async (
  scheduleId,
  doctorId,
  appointmentDate,
  tokenNumber,
  connection = db
) => {

  // Pehle exact slot find karo
  const [slotRows] = await connection.query(
    `
    SELECT
      id,
      schedule_id,
      doctor_id,
      start_date,
      start_time,
      end_time,
      token_number,
      status
    FROM schedule_slots
    WHERE schedule_id = ?
      AND doctor_id = ?
      AND DATE(start_date) = ?
      AND token_number = ?
    LIMIT 1
    FOR UPDATE
    `,
    [
      scheduleId,
      doctorId,
      appointmentDate,
      tokenNumber
    ]
  );

  console.log("ACTIVATE SLOT SEARCH:", {
    scheduleId,
    doctorId,
    appointmentDate,
    tokenNumber,
    foundSlot: slotRows
  });

  if (!slotRows.length) {
    console.log("SLOT NOT FOUND FOR ACTIVATION");

    return false;
  }

  const slot = slotRows[0];

  console.log("SLOT BEFORE ACTIVATION:", slot);

  // Slot ko active karo
  const [result] = await connection.query(
    `
    UPDATE schedule_slots
    SET status = 'active'
    WHERE id = ?
    `,
    [slot.id]
  );

  console.log("SLOT ACTIVATION RESULT:", {
    slotId: slot.id,
    affectedRows: result.affectedRows
  });

  return result.affectedRows === 1;
};

exports.getAppointmentDetails = async (
  doctorId,
  appointmentId,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.id AS appointment_id,
      a.token_number,
      a.slot_date,
      a.start_time,
      a.end_time,
      a.appointment_type,
      a.booking_type,
      a.hospital_name,
      a.reason_for_visit,
      a.status,

      u.id AS patient_id,

      COALESCE(
        u.full_name,
        ap.patient_name
      ) AS patient_name,

      COALESCE(
        u.phone_number,
        ap.patient_phone
      ) AS phone_number,

      COALESCE(
        u.email,
        ap.patient_email
      ) AS email,

      COALESCE(
        up.gender,
        ap.gender
      ) AS gender,

      COALESCE(
        up.age,
        ap.age
      ) AS age,

      up.weight,
      up.height,
      up.blood_group,
      up.language,
      up.existing_conditions,
      up.allergies,
      up.address,

      d.specialization

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN (
      SELECT up1.*
      FROM user_profiles up1
      INNER JOIN (
        SELECT
          user_id,
          MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
      ) latest
      ON up1.id = latest.max_id
    ) up
      ON up.user_id = u.id

    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id

    WHERE a.doctor_id = ?
      AND a.id = ?

    LIMIT 1
    `,
    [
      doctorId,
      appointmentId
    ]
  );

  return rows[0] || null;
};

exports.generateUniqueCode = async (
  connection,
  doctorId,
  appointmentDate
) => {

  let code;
  let exists = true;

  while (exists) {

    code = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    const [rows] = await connection.execute(
      `
      SELECT id
      FROM appointments
      WHERE doctor_id = ?
        AND slot_date = ?
        AND code = ?
      LIMIT 1
      `,
      [
        doctorId,
        appointmentDate,
        code
      ]
    );

    exists = rows.length > 0;
  }

  return code;
};

exports.getAllByPatient = async (
  userId,
  limit,
  offset,
  status = null,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.*,
      COALESCE(p.full_name, ap.patient_name) AS patient_name,
      ap.age,
      ap.gender,
      COALESCE(p.phone_number, ap.patient_phone) AS patient_phone,
      COALESCE(p.email, ap.patient_email) AS patient_email,
      u.full_name AS doctor_name,
      d.specialization AS doctor_department
    FROM appointments a
    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id
    LEFT JOIN users p
      ON p.id = a.patient_id
    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id
    LEFT JOIN users u
      ON u.id = a.doctor_id
    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )
      AND (? IS NULL OR a.status = ?)
    ORDER BY
      a.slot_date DESC,
      a.start_time ASC
    LIMIT ? OFFSET ?
    `,
    [userId, userId, status, status, limit, offset]
  );

  return rows;
};

exports.getAppointmentsByDateForPatient = async (
  patientId,
  date,
  status = null,
  connection = db
) => {
  const [rows] = await connection.query(
    `
    SELECT
      a.*,
      COALESCE(p.full_name, ap.patient_name) AS patient_name,
      ap.age,
      ap.gender,
      COALESCE(p.phone_number, ap.patient_phone) AS patient_phone,
      COALESCE(p.email, ap.patient_email) AS patient_email,
      u.full_name AS doctor_name,
      d.specialization AS doctor_department

    FROM appointments a

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id
    LEFT JOIN users p
      ON p.id = a.patient_id
    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id
    LEFT JOIN users u
      ON u.id = a.doctor_id

    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )

      AND a.slot_date >= ?
      AND a.slot_date < DATE_ADD(?, INTERVAL 1 DAY)

      AND (? IS NULL OR a.status = ?)

    ORDER BY
      a.start_time ASC,
      a.id ASC
    `,
    [
      patientId,
      patientId,
      date,
      date,
      status,
      status
    ]
  );

  return rows;
};

exports.getYearlyAppointmentStatsForPatient = async (
  patientId,
  year,
  connection = db
) => {
  const startDate = `${year}-01-01`;
  const nextYear = `${Number(year) + 1}-01-01`;

  const [rows] = await connection.query(
    `
    SELECT
      MONTH(a.slot_date) AS month_number,
      COUNT(DISTINCT a.id) AS appointment_count

    FROM appointments a

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )

      AND a.slot_date >= ?
      AND a.slot_date < ?

    GROUP BY MONTH(a.slot_date)

    ORDER BY MONTH(a.slot_date)
    `,
    [
      patientId,
      patientId,
      startDate,
      nextYear
    ]
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const result = monthNames.map(
    (month, index) => {

      const row = rows.find(
        item =>
          Number(item.month_number) === index + 1
      );

      return {
        month,
        monthNumber: index + 1,
        appointmentCount: row
          ? Number(row.appointment_count)
          : 0
      };
    }
  );

  return result;
};

exports.getYearlyAppointmentStatsForDoctor = async (
  doctorId,
  year,
  connection = db
) => {
  const [rows] = await connection.query(
    `
    SELECT
      MONTH(slot_date) AS month_number,
      COUNT(DISTINCT id) AS appointment_count
    FROM appointments
    WHERE doctor_id = ?
      AND slot_date >= ?
      AND slot_date < ?
    GROUP BY MONTH(slot_date)
    ORDER BY MONTH(slot_date)
    `,
    [
      doctorId,
      `${year}-01-01`,
      `${year + 1}-01-01`
    ]
  );

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  return monthNames.map((month, index) => {
    const row = rows.find(
      item => Number(item.month_number) === index + 1
    );

    return {
      month: month,
      monthNumber: index + 1,
      appointmentCount: row
        ? Number(row.appointment_count)
        : 0
    };
  });
};

exports.getMonthlyAppointmentStatsForDoctor = async (
  doctorId,
  year,
  month,
  connection = db
) => {
  const startDate =
    `${year}-${String(month).padStart(2, "0")}-01`;

  const nextMonth =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const [rows] = await connection.query(
    `
    SELECT
      DATE(slot_date) AS appointment_date,
      COUNT(DISTINCT id) AS appointment_count
    FROM appointments
    WHERE doctor_id = ?
      AND slot_date >= ?
      AND slot_date < ?
    GROUP BY DATE(slot_date)
    ORDER BY DATE(slot_date)
    `,
    [
      doctorId,
      startDate,
      nextMonth
    ]
  );

  const daysInMonth = new Date(
    year,
    month,
    0
  ).getDate();

  return Array.from(
    { length: daysInMonth },
    (_, index) => {

      const day = index + 1;

      const date =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const row = rows.find(
        item =>
          normalizeDateOnly(item.appointment_date) === date
      );

      return {
        date,
        appointmentCount: row
          ? Number(row.appointment_count)
          : 0
      };
    }
  );
};

exports.getMonthlyAppointmentStatsForPatient = async (
  patientId,
  year,
  month,
  connection = db
) => {
  const startDate =
    `${year}-${String(month).padStart(2, "0")}-01`;

  const nextMonth =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const [rows] = await connection.query(
    `
    SELECT
      DATE(a.slot_date) AS appointment_date,
      COUNT(DISTINCT a.id) AS appointment_count

    FROM appointments a

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )

      AND a.slot_date >= ?
      AND a.slot_date < ?

    GROUP BY DATE(a.slot_date)

    ORDER BY DATE(a.slot_date)
    `,
    [
      patientId,
      patientId,
      startDate,
      nextMonth
    ]
  );

  const daysInMonth = new Date(
    Number(year),
    Number(month),
    0
  ).getDate();

  const result = [];

  for (let i = 1; i <= daysInMonth; i++) {

    const date =
      `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

    const row = rows.find(
      item =>
        normalizeDateOnly(item.appointment_date) === date
    );

    result.push({
      date,
      appointmentCount: row
        ? Number(row.appointment_count)
        : 0
    });
  }

  return result;
};

exports.getWeeklyAppointmentStatsForDoctor = async (
  doctorId,
  weekDate,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      DATE(slot_date) AS appointment_date,
      COUNT(DISTINCT id) AS appointment_count
    FROM appointments
    WHERE doctor_id = ?
      AND slot_date >= DATE_SUB(?, INTERVAL WEEKDAY(?) DAY)
      AND slot_date < DATE_ADD(
        DATE_SUB(?, INTERVAL WEEKDAY(?) DAY),
        INTERVAL 7 DAY
      )
    GROUP BY DATE(slot_date)
    ORDER BY DATE(slot_date)
    `,
    [
      doctorId,
      weekDate,
      weekDate,
      weekDate,
      weekDate
    ]
  );

  const result = [];

  const startDate = new Date(`${weekDate}T00:00:00`);

  const day = startDate.getDay();

  const mondayOffset =
    day === 0 ? -6 : 1 - day;

  startDate.setDate(
    startDate.getDate() + mondayOffset
  );

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  for (let i = 0; i < 7; i++) {

    const currentDate = new Date(startDate);

    currentDate.setDate(
      startDate.getDate() + i
    );

    const date =
      normalizeDateOnly(currentDate);

    const row = rows.find(
      item =>
        normalizeDateOnly(item.appointment_date) === date
    );

    result.push({
      day: dayNames[i],
      date,
      appointmentCount: row
        ? Number(row.appointment_count)
        : 0
    });
  }

  return result;
};

exports.getWeeklyAppointmentStatsForPatient = async (
  patientId,
  weekDate,
  connection = db
) => {
  const [rows] = await connection.query(
    `
    SELECT
      DATE(a.slot_date) AS appointment_date,
      COUNT(DISTINCT a.id) AS appointment_count
    FROM appointments a

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )

      AND a.slot_date >=
        DATE_SUB(?, INTERVAL WEEKDAY(?) DAY)

      AND a.slot_date <
        DATE_ADD(
          DATE_SUB(?, INTERVAL WEEKDAY(?) DAY),
          INTERVAL 7 DAY
        )

    GROUP BY DATE(a.slot_date)

    ORDER BY DATE(a.slot_date)
    `,
    [
      patientId,
      patientId,
      weekDate,
      weekDate,
      weekDate,
      weekDate
    ]
  );

  const startDate = new Date(`${weekDate}T00:00:00`);

  const day = startDate.getDay();

  const mondayOffset =
    day === 0
      ? -6
      : 1 - day;

  startDate.setDate(
    startDate.getDate() + mondayOffset
  );

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const result = [];

  for (let i = 0; i < 7; i++) {

    const currentDate = new Date(startDate);

    currentDate.setDate(
      startDate.getDate() + i
    );

    const date =
      normalizeDateOnly(currentDate);

    const row = rows.find(
      item =>
        normalizeDateOnly(item.appointment_date) === date
    );

    result.push({
      day: dayNames[i],
      date,
      appointmentCount: row
        ? Number(row.appointment_count)
        : 0
    });
  }

  return result;
};

exports.getAppointmentsByDateForDoctor = async (
  doctorId,
  date,
  status = null,
  connection = db
) => {
  const [rows] = await connection.query(
    `
    SELECT
      a.id AS appointment_id,
      a.slot_date,
      a.start_time,
      a.end_time,
      a.status,
      a.appointment_type AS mode,
      a.code,
      a.token_number,
      a.patient_id,

      patient.full_name AS patient_name,

      doctor.full_name AS doctor_name,
      d.specialization AS doctor_department

    FROM appointments a

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id

    LEFT JOIN users doctor
      ON doctor.id = a.doctor_id

    LEFT JOIN users patient
      ON patient.id = a.patient_id

    WHERE
      a.doctor_id = ?

      AND a.slot_date >= ?
      AND a.slot_date < DATE_ADD(?, INTERVAL 1 DAY)

      AND (? IS NULL OR a.status = ?)

    ORDER BY
      a.start_time ASC
    `,
    [
      doctorId,
      date,
      date,
      status,
      status
    ]
  );

  return rows;
};



exports.getPatientAppointmentCount = async (
  userId,
  status = null,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments a
    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id
    WHERE
      (
        a.patient_id = ?
        OR ap.user_id = ?
      )
      AND (? IS NULL OR a.status = ?)
    `,
    [userId, userId, status, status]
  );

  return rows[0].total;
};

exports.getAllByDoctor = async (
  doctorId,
  limit,
  offset,
  status = null,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT
      a.*,
      COALESCE(p.full_name, ap.patient_name) AS patient_name,
      ap.age,
      ap.gender,
      COALESCE(p.phone_number, ap.patient_phone) AS patient_phone,
      COALESCE(p.email, ap.patient_email) AS patient_email,
      u.full_name AS doctor_name,
      d.specialization AS doctor_department
    FROM appointments a
    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id
    LEFT JOIN users p
      ON p.id = a.patient_id
    LEFT JOIN doctors d
      ON d.user_id = a.doctor_id
    LEFT JOIN users u
      ON u.id = a.doctor_id
    WHERE
      a.doctor_id = ?
      AND (? IS NULL OR a.status = ?)
    ORDER BY
      a.slot_date DESC,
      a.start_time ASC
    LIMIT ? OFFSET ?
    `,
    [doctorId, status, status, limit, offset]
  );

  return rows;
};

exports.getDoctorAppointmentCount = async (
  doctorId,
  status = null,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT COUNT(*) AS total
    FROM appointments
    WHERE doctor_id = ?
      AND (? IS NULL OR status = ?)
    `,
    [doctorId, status, status]
  );

  return rows[0].total;
};


exports.getAppointments = async (
  {
    doctorId,
    limit,
    offset
  },
  connection = db
) => {

  const todayDate = new Date()
    .toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });

  const query = `
    SELECT
      a.id AS appointment_id,
      a.token_number,

      TIME_FORMAT(
        a.start_time,
        '%h:%i %p'
      ) AS start_time,

      a.status,
      a.reason_for_visit,
      a.appointment_type,

      u.id AS patient_id,

      COALESCE(
        u.full_name,
        ap.patient_name
      ) AS patient_name,

      COALESCE(
        u.email,
        ap.patient_email
      ) AS email,

      COALESCE(
        up.age,
        ap.age
      ) AS age,

      COALESCE(
        up.gender,
        ap.gender
      ) AS gender,

      up.weight,
      up.height,
      up.blood_group,
      up.language

    FROM appointments a

    LEFT JOIN users u
      ON u.id = a.patient_id

    LEFT JOIN appointment_patients ap
      ON ap.appointment_id = a.id

    LEFT JOIN (
      SELECT up1.*
      FROM user_profiles up1
      INNER JOIN (
        SELECT
          user_id,
          MAX(id) AS max_id
        FROM user_profiles
        GROUP BY user_id
      ) latest
      ON up1.id = latest.max_id
    ) up
      ON up.user_id = u.id

    WHERE
      a.doctor_id = ?
      AND DATE(a.slot_date) = ?
      AND a.status IN ('PENDING', 'IN_PROGRESS')

    ORDER BY
      a.start_time ASC,
      a.token_number ASC

    LIMIT ?
    OFFSET ?
  `;

  const [rows] = await connection.query(
    query,
    [
      doctorId,
      todayDate,
      Number(limit),
      Number(offset)
    ]
  );

  const [[count]] = await connection.query(
    `
    SELECT
      COUNT(*) AS total
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND status IN ('PENDING', 'IN_PROGRESS')
    `,
    [
      doctorId,
      todayDate
    ]
  );

  return {
    rows,
    total: count.total
  };
};


exports.getDashboardCards = async (
  {
    doctorId
  },
  connection = db
) => {

  const [[row]] =
    await connection.query(
      `
      SELECT

        COUNT(*) AS total_appointment,

        SUM(
          CASE
            WHEN status = 'PENDING'
            THEN 1
            ELSE 0
          END
        ) AS total_upcoming,

        SUM(
          CASE
            WHEN status = 'COMPLETED'
            THEN 1
            ELSE 0
          END
        ) AS total_completed,

        SUM(
          CASE
            WHEN status = 'CANCELLED'
            THEN 1
            ELSE 0
          END
        ) AS total_cancelled

      FROM appointments

      WHERE doctor_id = ?
      `,
      [doctorId]
    );

  return row;
};

exports.getPatientDashboardCards = async (
  {
    doctorId,
    filter,
    mode
  },
  connection = db
) => {

  let dateCondition = "";

  switch (filter) {

    case "day":
      dateCondition =
        "DATE(slot_date) = CURDATE()";
      break;

    case "week":
      dateCondition =
        "YEARWEEK(slot_date,1)=YEARWEEK(CURDATE(),1)";
      break;

    case "month":
      dateCondition =
        "MONTH(slot_date)=MONTH(CURDATE()) AND YEAR(slot_date)=YEAR(CURDATE())";
      break;

    case "year":
      dateCondition =
        "YEAR(slot_date)=YEAR(CURDATE())";
      break;

    default:
      dateCondition =
        "DATE(slot_date)=CURDATE()";
  }

  const query = `
    SELECT

      COUNT(
        CASE
          WHEN appointment_type = ?
          AND ${dateCondition}
          THEN 1
        END
      ) AS patient,

      COUNT(
        CASE
          WHEN appointment_type = ?
          AND status='PENDING'
          AND ${dateCondition}
          THEN 1
        END
      ) AS pending,

      COUNT(
        CASE
          WHEN appointment_type = ?
          AND status='COMPLETED'
          AND ${dateCondition}
          THEN 1
        END
      ) AS completed,

      (
        SELECT COUNT(*)
        FROM appointments
        WHERE doctor_id=?
        AND status='COMPLETED'
      ) AS total_patient

    FROM appointments

    WHERE doctor_id=?
  `;

  const [[row]] =
    await connection.query(query, [
      mode,
      mode,
      mode,
      doctorId,
      doctorId
    ]);

  if (
    String(mode).toLowerCase() === "online"
  ) {

    return {

      online_patient: row.patient,

      online_pending: row.pending,

      online_complete: row.completed,

      total_patient: row.total_patient

    };

  }

  return {

    offline_patient: row.patient,

    offline_pending: row.pending,

    offline_complete: row.completed,

    total_patient: row.total_patient

  };

};

exports.checkUserSameSlot = async (
  patientId,
  date,
  timeSlot,
  connection = db
) => {

  const [start, end] =
    timeSlot
      .split(" - ")
      .map(parse12to24);

  const [rows] =
    await connection.query(
      `
      SELECT id
      FROM appointments
      WHERE patient_id = ?
      AND slot_date = ?
      AND start_time = ?
      AND end_time = ?
      AND status <> 'CANCELLED'
      LIMIT 1
      `,
      [
        patientId,
        date,
        start,
        end
      ]
    );

  return rows.length > 0;

};

exports.getNextTokenNumber = async (
  doctorId,
  appointmentDate,
  hospitalName,
  connection = db
) => {

  const [[row]] =
    await connection.query(
      `
      SELECT
      COALESCE(
        MAX(token_number),
        0
      ) + 1 AS nextToken

      FROM appointments

      WHERE doctor_id = ?
      AND DATE(slot_date)=DATE(?)
      AND LOWER(TRIM(hospital_name))
          = LOWER(TRIM(?))
      `,
      [
        doctorId,
        appointmentDate,
        hospitalName
      ]
    );

  return row.nextToken;
};

exports.checkTokenExists = async (
  doctorId,
  appointmentDate,
  hospitalName,
  token,
  connection = db
) => {

  const [rows] = await connection.query(
    `
    SELECT id
    FROM appointments
    WHERE doctor_id = ?
      AND DATE(slot_date) = ?
      AND LOWER(TRIM(hospital_name)) = LOWER(TRIM(?))
      AND token_number = ?
    LIMIT 1
    `,
    [
      doctorId,
      appointmentDate,
      hospitalName,
      token
    ]
  );

  return rows.length > 0;
};

exports.trackAppointment = async (userId) => {
  try {

    const userAppointmentSql = `
      SELECT
        a.id AS appointment_id,
        a.doctor_id,
        a.patient_id,
        a.token_number,
        a.slot_date,
        a.start_time,
        a.end_time,
        a.status,
        a.hospital_name
      FROM appointments a
      WHERE a.patient_id = ?
        AND a.slot_date = CURDATE()
        AND a.status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
      ORDER BY
        a.doctor_id ASC,
        a.hospital_name ASC,
        a.token_number ASC
    `;

    const [userAppointments] = await db.execute(
      userAppointmentSql,
      [userId]
    );

    if (!userAppointments.length) {
      return {
        appointments: []
      };
    }

    const timeToMinutes = (time) => {
      if (!time) return null;

      const parts = String(time)
        .split(":")
        .map(Number);

      if (
        parts.length < 2 ||
        !Number.isFinite(parts[0]) ||
        !Number.isFinite(parts[1])
      ) {
        return null;
      }

      return (
        parts[0] * 60 +
        parts[1] +
        (Number(parts[2]) || 0) / 60
      );
    };

    const getDuration = (appointment) => {
      const start = timeToMinutes(
        appointment.start_time
      );

      const end = timeToMinutes(
        appointment.end_time
      );

      if (
        start === null ||
        end === null ||
        end <= start
      ) {
        return 0;
      }

      return end - start;
    };

    const formatWaitingTime = (minutes) => {
      const totalMinutes = Math.max(
        Math.ceil(Number(minutes) || 0),
        0
      );

      if (totalMinutes >= 60) {
        const hours = Math.floor(
          totalMinutes / 60
        );

        const remainingMinutes =
          totalMinutes % 60;

        if (remainingMinutes > 0) {
          return `${hours}h ${remainingMinutes}min`;
        }

        return `${hours}h`;
      }

      return `${totalMinutes} min`;
    };

    const now = new Date();

    const indiaTimeParts =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(now);

    const currentHour = Number(
      indiaTimeParts.find(
        p => p.type === "hour"
      )?.value || 0
    );

    const currentMinute = Number(
      indiaTimeParts.find(
        p => p.type === "minute"
      )?.value || 0
    );

    const currentSecond = Number(
      indiaTimeParts.find(
        p => p.type === "second"
      )?.value || 0
    );

    const currentTimeMinutes =
      currentHour * 60 +
      currentMinute +
      currentSecond / 60;

    const queueGroups = [];

    for (const appointment of userAppointments) {
      const doctorId = Number(
        appointment.doctor_id
      );

      const hospitalName =
        appointment.hospital_name;

      const slotDate = String(
        appointment.slot_date
      ).substring(0, 10);

      const exists = queueGroups.some(
        group =>
          group.doctorId === doctorId &&
          group.hospitalName === hospitalName &&
          group.slotDate === slotDate
      );

      if (!exists) {
        queueGroups.push({
          doctorId,
          hospitalName,
          slotDate
        });
      }
    }

    const queueMap = {};

    for (const group of queueGroups) {
      const queueSql = `
        SELECT
          a.id AS appointment_id,
          a.doctor_id,
          a.patient_id,
          a.token_number,
          a.slot_date,
          a.start_time,
          a.end_time,
          a.status,
          a.hospital_name
        FROM appointments a
        WHERE a.doctor_id = ?
          AND LOWER(TRIM(a.hospital_name))
              = LOWER(TRIM(?))
          AND a.slot_date = ?
        ORDER BY a.token_number ASC
      `;

      const [rows] = await db.execute(
        queueSql,
        [
          group.doctorId,
          group.hospitalName,
          group.slotDate
        ]
      );

      const key =
        `${group.doctorId}|` +
        `${group.hospitalName}|` +
        `${group.slotDate}`;

      queueMap[key] = rows;
    }

    const getQueueState = (queue) => {
      if (
        !Array.isArray(queue) ||
        queue.length === 0
      ) {
        return {
          currentServing: 0,
          currentInProgress: null
        };
      }

      const completedTokens = queue
        .filter(
          item =>
            item.status === "COMPLETED"
        )
        .map(
          item =>
            Number(item.token_number)
        )
        .filter(
          Number.isFinite
        );

      const lastCompleted =
        completedTokens.length > 0
          ? Math.max(...completedTokens)
          : 0;

      const inProgressAppointments = queue
        .filter(item => {
          const token = Number(
            item.token_number
          );

          return (
            item.status === "IN_PROGRESS" &&
            Number.isFinite(token) &&
            token > lastCompleted
          );
        })
        .sort(
          (a, b) =>
            Number(a.token_number) -
            Number(b.token_number)
        );

      const currentInProgress =
        inProgressAppointments.length > 0
          ? inProgressAppointments[0]
          : null;

      const currentServing =
        currentInProgress
          ? Number(
              currentInProgress.token_number
            )
          : lastCompleted;

      return {
        currentServing,
        currentInProgress
      };
    };

    const queueStateMap = {};

    Object.entries(queueMap).forEach(
      ([key, queue]) => {
        queueStateMap[key] =
          getQueueState(queue);
      }
    );

    const buildBaseResponse = (
      appointment,
      currentServing
    ) => {
      return {
        appointment_id:
          appointment.appointment_id,

        doctor_id:
          Number(appointment.doctor_id),

        hospital_name:
          appointment.hospital_name,

        slot_date:
          appointment.slot_date,

        start_time:
          appointment.start_time,

        end_time:
          appointment.end_time,

        my_token:
          Number(appointment.token_number),

        currently_serving:
          currentServing
      };
    };

    const appointments =
      userAppointments.map(
        appointment => {

          const doctorId =
            Number(
              appointment.doctor_id
            );

          const myToken =
            Number(
              appointment.token_number
            );

          const slotDate =
            String(
              appointment.slot_date
            ).substring(0, 10);

          const key =
            `${doctorId}|` +
            `${appointment.hospital_name}|` +
            `${slotDate}`;

          const doctorQueue =
            queueMap[key] || [];

          const queueState =
            queueStateMap[key] || {
              currentServing: 0,
              currentInProgress: null
            };

          const currentServing =
            queueState.currentServing;

          const currentInProgress =
            queueState.currentInProgress;

          const base =
            buildBaseResponse(
              appointment,
              currentServing
            );

          // COMPLETED
          if (
            appointment.status ===
            "COMPLETED"
          ) {
            return {
              ...base,

              waiting_tokens: 0,

              approx_waiting_minutes: 0,

              approx_waiting_time:
                "0 min",

              status:
                "COMPLETED",

              message:
                "Your appointment has been completed."
            };
          }

          // IN_PROGRESS
          if (
            appointment.status ===
            "IN_PROGRESS"
          ) {
            return {
              ...base,

              waiting_tokens: 0,

              approx_waiting_minutes: 0,

              approx_waiting_time:
                "0 min",

              status:
                "IN_PROGRESS",

              message:
                "Your consultation is in progress."
            };
          }

          const startMinutes =
            timeToMinutes(
              appointment.start_time
            );

          // USER IS LATE
          if (
            startMinutes !== null &&
            currentTimeMinutes >=
              startMinutes + 30
          ) {
            const lateByMinutes =
              Math.max(
                currentTimeMinutes -
                  startMinutes,
                0
              );

            return {
              ...base,

              approx_waiting_minutes:
                Math.floor(
                  lateByMinutes
                ),

              approx_waiting_time:
                `${formatWaitingTime(
                  lateByMinutes
                )} you are late`,

              status:
                "PENDING",

              message:
                "You are late. Please contact the assistant or doctor."
            };
          }

          // DOCTOR ALREADY PASSED USER TOKEN
          if (
            currentServing > myToken
          ) {
            const lateByMinutes =
              startMinutes !== null
                ? Math.max(
                    currentTimeMinutes -
                      startMinutes,
                    0
                  )
                : 0;

            return {
              ...base,

              approx_waiting_minutes:
                Math.floor(
                  lateByMinutes
                ),

              approx_waiting_time:
                `${formatWaitingTime(
                  lateByMinutes
                )} you are late`,

              status:
                "PENDING",

              message:
                "You are late. Please contact the assistant or doctor."
            };
          }

          const waitingAppointments =
            doctorQueue
              .filter(item => {
                const token =
                  Number(
                    item.token_number
                  );

                return (
                  Number.isFinite(token) &&
                  token > currentServing &&
                  token < myToken &&
                  item.status === "PENDING"
                );
              })
              .sort(
                (a, b) =>
                  Number(
                    a.token_number
                  ) -
                  Number(
                    b.token_number
                  )
              );

          const waitingTokens =
            waitingAppointments.length;

          let waitingMinutes = 0;

          let queueCursor =
            currentTimeMinutes;

          if (
            currentInProgress
          ) {
            const currentEnd =
              timeToMinutes(
                currentInProgress.end_time
              );

            if (
              currentEnd !== null
            ) {
              const remainingTime =
                Math.max(
                  currentEnd -
                    currentTimeMinutes,
                  0
                );

              waitingMinutes +=
                remainingTime;

              queueCursor =
                Math.max(
                  currentTimeMinutes,
                  currentEnd
                );
            }
          }

          for (
            const item
            of waitingAppointments
          ) {

            const itemStart =
              timeToMinutes(
                item.start_time
              );

            const itemEnd =
              timeToMinutes(
                item.end_time
              );

            const duration =
              getDuration(item);

            if (
              duration <= 0
            ) {
              continue;
            }

            if (
              itemStart !== null
            ) {

              const gap =
                Math.max(
                  itemStart -
                    queueCursor,
                  0
                );

              waitingMinutes +=
                gap;

              queueCursor =
                Math.max(
                  queueCursor,
                  itemStart
                );
            }

            waitingMinutes +=
              duration;

            if (
              itemEnd !== null
            ) {

              queueCursor =
                Math.max(
                  queueCursor,
                  itemEnd
                );

            } else {

              queueCursor +=
                duration;
            }
          }

          waitingMinutes =
            Math.max(
              waitingMinutes,
              0
            );

          // NO CURRENT SERVING TOKEN
          if (
            currentServing === 0
          ) {

            if (
              waitingAppointments.length ===
                0 &&
              startMinutes !== null
            ) {
              waitingMinutes =
                Math.max(
                  startMinutes -
                    currentTimeMinutes,
                  0
                );
            }

            return {
              ...base,

              waiting_tokens:
                waitingTokens,

              approx_waiting_minutes:
                Math.ceil(
                  waitingMinutes
                ),

              approx_waiting_time:
                formatWaitingTime(
                  waitingMinutes
                ),

              status:
                "PENDING",

              message:
                "Your appointment is scheduled."
            };
          }

          // USER IS WAITING
          return {
            ...base,

            waiting_tokens:
              waitingTokens,

            approx_waiting_minutes:
              Math.ceil(
                waitingMinutes
              ),

            approx_waiting_time:
              formatWaitingTime(
                waitingMinutes
              ),

            status:
              "PENDING",

            message:
              waitingTokens > 0
                ? "Please wait. Your turn is coming."
                : "Your turn is next."
          };
        }
      );

    return {
      appointments
    };

  } catch (error) {
    console.error(
      "Track Appointment Model Error:",
      error
    );

    throw error;
  }
};