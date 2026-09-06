const db = require("../../config/db");

exports.findUserByEmail = async (email, conn = db) => {
  const [rows] = await conn.execute(
    `
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
};

exports.findByEmail = async (email, conn = db) => {
  const [rows] = await conn.execute(
    `
    SELECT *
    FROM doctor_registrations
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
};

exports.findByMobile = async (mobile, conn = db) => {
  const [rows] = await conn.execute(
    `
    SELECT *
    FROM doctor_registrations
    WHERE mobile = ?
    LIMIT 1
    `,
    [mobile]
  );

  return rows[0] || null;
};

exports.findByEmailExceptId = async (
  email,
  id,
  conn = db
) => {
  const [rows] = await conn.execute(
    `
    SELECT *
    FROM doctor_registrations
    WHERE email = ?
      AND id != ?
    LIMIT 1
    `,
    [email, id]
  );

  return rows[0] || null;
};

exports.findByMobileExceptId = async (
  mobile,
  id,
  conn = db
) => {
  const [rows] = await conn.execute(
    `
    SELECT *
    FROM doctor_registrations
    WHERE mobile = ?
      AND id != ?
    LIMIT 1
    `,
    [mobile, id]
  );

  return rows[0] || null;
};

exports.findByRegistrationNumberExceptId = async (
  registrationNumber,
  id,
  conn = db
) => {
  const [rows] = await conn.execute(
    `
    SELECT *
    FROM doctor_registrations
    WHERE medical_registration_number = ?
      AND id != ?
    LIMIT 1
    `,
    [registrationNumber, id]
  );

  return rows[0] || null;
};

exports.findUserByPhone = async (phone, conn = db) => {
  const [rows] = await conn.execute(
    `
    SELECT id
    FROM users
    WHERE phone_number = ?
    LIMIT 1
    `,
    [phone]
  );

  return rows[0] || null;
};


exports.findByRegistrationNumber = async (
    registrationNumber,
    conn = db
) => {

    const [rows] = await conn.execute(
        `SELECT *
         FROM doctor_registrations
         WHERE medical_registration_number = ?
         LIMIT 1`,
        [registrationNumber]
    );

    return rows[0] || null;
};

exports.create = async (data, conn = db) => {
  const {
    fullName,
    gender,
    age,
    email,
    mobile,
    medicalRegistrationNumber,
    medicalCouncil,
    qualification,
    specialization,
    registrationExpiryDate,
    hospitalDetail,
  } = data;

  const [result] = await conn.execute(
    `
    INSERT INTO doctor_registrations
    (
      full_name,
      gender,
      age,
      email,
      mobile,
      medical_registration_number,
      medical_council,
      qualification,
      specialization,
      registration_expiry_date,
      hospital_detail,
      onboarding_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
    `,
    [
      fullName || null,
      gender || null,
      age || null,
      email || null,
      mobile || null,
      medicalRegistrationNumber || null,
      medicalCouncil || null,
      qualification || null,
      specialization || null,
      registrationExpiryDate || null,
      hospitalDetail
        ? JSON.stringify(hospitalDetail)
        : null,
    ]
  );

  return result.insertId;
};

exports.updatePartial = async (
  id,
  data,
  conn = db
) => {

  const fieldMap = {
    fullName: "full_name",
    gender: "gender",
    age: "age",
    email: "email",
    mobile: "mobile",
    medicalRegistrationNumber:
      "medical_registration_number",
    medicalCouncil: "medical_council",
    qualification: "qualification",
    specialization: "specialization",
    registrationExpiryDate:
      "registration_expiry_date",
  };

  const fields = [];
  const values = [];

  Object.keys(fieldMap).forEach((key) => {

    if (data[key] !== undefined) {

      fields.push(
        `${fieldMap[key]} = ?`
      );

      values.push(
        data[key] === ""
          ? null
          : data[key]
      );
    }
  });

  if (fields.length === 0) {
    return;
  }

  fields.push(
    "updated_at = CURRENT_TIMESTAMP"
  );

  values.push(id);

  const sql = `
    UPDATE doctor_registrations
    SET ${fields.join(", ")}
    WHERE id = ?
  `;

  await conn.execute(sql, values);
};

exports.updateDocuments = async (
  id,
  data,
  conn = db
) => {
  const {
    medicalRegistrationCertificate,
    medicalDegreeCertificate,
    governmentIdProof,
    selfie,
  } = data;

  const fields = [];
  const values = [];

  if (medicalRegistrationCertificate !== undefined) {
    fields.push(
      "medical_registration_certificate = ?"
    );

    values.push(
      medicalRegistrationCertificate
    );
  }

  if (medicalDegreeCertificate !== undefined) {
    fields.push(
      "medical_degree_certificate = ?"
    );

    values.push(
      medicalDegreeCertificate
    );
  }

  if (governmentIdProof !== undefined) {
    fields.push(
      "government_id_proof = ?"
    );

    values.push(
      governmentIdProof
    );
  }

  if (selfie !== undefined) {
    fields.push(
      "selfie = ?"
    );

    values.push(selfie);
  }

  if (fields.length === 0) {
    return;
  }

  fields.push(
    "updated_at = CURRENT_TIMESTAMP"
  );

  values.push(id);

  await conn.execute(
    `
      UPDATE doctor_registrations
      SET
        ${fields.join(", ")}
      WHERE id = ?
        AND onboarding_status = 'DRAFT'
    `,
    values
  );
};

exports.findById = async (id, conn = db) => {
  const [rows] = await conn.execute(
    `
      SELECT
        id,
        full_name,
        gender,
        age,
        email,
        mobile,
        medical_registration_number,
        medical_council,
        qualification,
        specialization,
        registration_expiry_date,
        hospital_detail,

        medical_registration_certificate,
        medical_degree_certificate,
        government_id_proof,
        selfie,

        email_verified,
        onboarding_status,

        created_at,
        updated_at

      FROM doctor_registrations

      WHERE id = ?

      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

exports.findAll = async (filters = {}, conn = db) => {
  const {
    limit = 10,
    offset = 0,
    search = "",
    onboardingStatus = "",
  } = filters;

  const parsedLimit = Number.parseInt(limit, 10);
  const parsedOffset = Number.parseInt(offset, 10);

  const safeLimit = Number.isInteger(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : 10;

  const safeOffset = Number.isInteger(parsedOffset)
    ? Math.max(0, parsedOffset)
    : 0;

  let sql = `
    SELECT
      id,
      full_name,
      gender,
      age,
      email,
      mobile,
      medical_registration_number,
      medical_council,
      qualification,
      specialization,
      hospital_detail,
      registration_expiry_date,

      medical_registration_certificate,
      medical_degree_certificate,
      government_id_proof,
      selfie,

      onboarding_status,
      created_at

    FROM doctor_registrations

    WHERE 1 = 1
  `;

  const params = [];

  const trimmedSearch = String(search || "").trim();

  if (trimmedSearch) {
    sql += `
      AND (
        full_name LIKE ?
        OR email LIKE ?
        OR mobile LIKE ?
        OR medical_registration_number LIKE ?
        OR medical_council LIKE ?
        OR qualification LIKE ?
        OR specialization LIKE ?
      )
    `;

    const searchValue = `%${trimmedSearch}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  const validStatuses = [
    "DRAFT",
    "SUBMITTED",
    "VERIFIED",
    "REJECTED",
  ];

  const normalizedStatus = String(
    onboardingStatus || ""
  )
    .trim()
    .toUpperCase();

  if (normalizedStatus) {
    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(
        "Invalid onboarding status."
      );
    }

    sql += `
      AND onboarding_status = ?
    `;

    params.push(normalizedStatus);
  }

  sql += `
    ORDER BY id DESC
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `;

  const [rows] = await conn.execute(
    sql,
    params
  );

  return rows;
};

exports.countAll = async (
  search = "",
  onboardingStatus,
  conn = db
) => {
  let sql = `
    SELECT COUNT(*) AS total
    FROM doctor_registrations
    WHERE 1 = 1
  `;

  const params = [];

  // Search
  if (search) {
    sql += `
      AND (
        full_name LIKE ?
        OR email LIKE ?
        OR mobile LIKE ?
        OR medical_registration_number LIKE ?
        OR medical_council LIKE ?
        OR qualification LIKE ?
        OR specialization LIKE ?
      )
    `;

    const searchValue = `%${search}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  // Filter by onboarding status
  if (onboardingStatus) {
    sql += `
      AND onboarding_status = ?
    `;

    params.push(onboardingStatus);
  }

  const [rows] = await conn.execute(
    sql,
    params
  );

  return Number(rows[0].total);
};

exports.update = async (
  id,
  data,
  conn = db
) => {

  const {
    fullName,
    gender,
    age,
    email,
    mobile,
    medicalRegistrationNumber,
    medicalCouncil,
    qualification,
    specialization,
    registrationExpiryDate,
  } = data;


  await conn.execute(
    `
      UPDATE doctor_registrations
      SET
        full_name = ?,
        gender = ?,
        age = ?,
        email = ?,
        mobile = ?,
        medical_registration_number = ?,
        medical_council = ?,
        qualification = ?,
        specialization = ?,
        registration_expiry_date = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
        AND onboarding_status = 'DRAFT'
    `,
    [
      fullName,
      gender,
      age,
      email,
      mobile,
      medicalRegistrationNumber,
      medicalCouncil,
      qualification,
      specialization,
      registrationExpiryDate,
      id,
    ]
  );
};

exports.submit = async (id, conn = db) => {
  await conn.execute(
    `
      UPDATE doctor_registrations
      SET
        onboarding_status = 'SUBMITTED',
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
        AND onboarding_status = 'DRAFT'
    `,
    [id]
  );
};

exports.delete = async (id, conn = db) => {
  await conn.execute(
    `
      DELETE FROM doctor_registrations
      WHERE id = ?
        AND onboarding_status = 'DRAFT'
    `,
    [id]
  );
};

exports.saveEmailOtp = async (
  email,
  otp,
  expiryOrConn = null,
  conn = db
) => {

  let expiry = null;

  if (
    expiryOrConn &&
    typeof expiryOrConn.execute === "function"
  ) {
    conn = expiryOrConn;
  } else {
    expiry = expiryOrConn;
  }

  if (expiry) {

    await conn.execute(
      `
        UPDATE doctor_registrations
        SET
          email_otp = ?,
          email_otp_expiry = ?
        WHERE email = ?
      `,
      [
        otp,
        expiry,
        email,
      ]
    );

  } else {

    await conn.execute(
      `
        UPDATE doctor_registrations
        SET
          email_otp = ?,
          email_otp_expiry =
            DATE_ADD(
              NOW(),
              INTERVAL 5 MINUTE
            )
        WHERE email = ?
      `,
      [
        otp,
        email,
      ]
    );
  }
};

exports.verifyEmailOtp = async (
  email,
  otp,
  conn = db
) => {

  const [rows] = await conn.execute(
    `
    SELECT id
    FROM doctor_registrations
    WHERE email = ?
      AND email_otp = ?
      AND email_otp_expiry > NOW()
    LIMIT 1
    `,
    [
      email,
      otp
    ]
  );

  return rows[0];
};

exports.clearEmailOtp = async (
  email,
  conn = db
) => {

  await conn.execute(
    `
    UPDATE doctor_registrations
    SET
      email_otp = NULL,
      email_otp_expiry = NULL
    WHERE email = ?
    `,
    [email]
  );
};

exports.markEmailVerified = async (email, conn = db) => {

    await conn.execute(
        `UPDATE doctor_registrations
        SET
            email_verified=1,
            email_otp=NULL,
            email_otp_expiry=NULL
        WHERE email=?`,
        [email]
    );

};

exports.findDocumentsById = async (id) => {
  const sql = `
    SELECT
      id,
      medical_registration_certificate,
      medical_degree_certificate,
      government_id_proof,
      hospital_detail,
      selfie,
      created_at,
      updated_at
    FROM doctor_registrations
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);

  return rows.length ? rows[0] : null;
};

exports.updateOnboardingStatus = async (
  registrationId,
  status,
  conn = db
) => {
  const [result] = await conn.execute(
    `
    UPDATE doctor_registrations
    SET onboarding_status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    LIMIT 1
    `,
    [status, registrationId]
  );

  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows,
  };
};

exports.getDoctorRegistrations = async ({
  filter,
  date,
  onboarding_status,
  page = 1,
  limit = 10,
}) => {
  try {
    const conditions = [];
    const params = [];

    // Date filter
    if (filter && date) {
      let startDate;
      let endDate;

      const inputDate = new Date(`${date}T00:00:00`);

      if (Number.isNaN(inputDate.getTime())) {
        throw new Error("Invalid date.");
      }

      switch (filter) {
        case "day": {
          startDate = date;

          const nextDay = new Date(inputDate);
          nextDay.setDate(nextDay.getDate() + 1);

          endDate = nextDay
            .toISOString()
            .split("T")[0];

          break;
        }

        case "week": {
          const day = inputDate.getDay();

          const diffToMonday =
            day === 0 ? -6 : 1 - day;

          const monday = new Date(inputDate);
          monday.setDate(
            monday.getDate() + diffToMonday
          );

          const nextMonday = new Date(monday);
          nextMonday.setDate(
            nextMonday.getDate() + 7
          );

          startDate = monday
            .toISOString()
            .split("T")[0];

          endDate = nextMonday
            .toISOString()
            .split("T")[0];

          break;
        }

        case "month": {
          const year = inputDate.getFullYear();
          const month = inputDate.getMonth();

          const firstDay = new Date(
            year,
            month,
            1
          );

          const firstDayNextMonth = new Date(
            year,
            month + 1,
            1
          );

          startDate = firstDay
            .toISOString()
            .split("T")[0];

          endDate = firstDayNextMonth
            .toISOString()
            .split("T")[0];

          break;
        }

        case "year": {
          const year = inputDate.getFullYear();

          startDate = `${year}-01-01`;
          endDate = `${year + 1}-01-01`;

          break;
        }
      }

      if (startDate && endDate) {
        conditions.push(`
          dr.created_at >= ?
          AND dr.created_at < ?
        `);

        params.push(startDate, endDate);
      }
    }

    // Onboarding status filter
    if (onboarding_status) {
      conditions.push(`
        dr.onboarding_status = ?
      `);

      params.push(onboarding_status);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // Pagination
    const safePage = Math.max(
      1,
      Number(page) || 1
    );

    const safeLimit = Math.min(
      100,
      Math.max(1, Number(limit) || 10)
    );

    const offset =
      (safePage - 1) * safeLimit;

    // Count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM doctor_registrations dr
      ${whereClause}
    `;

    const [countRows] = await db.execute(
      countSql,
      params
    );

    const total = Number(
      countRows[0]?.total || 0
    );

    // Final data query
    const dataSql = `
      SELECT
        dr.id,
        dr.full_name,
        dr.gender,
        dr.age,
        dr.email,
        dr.mobile,
        dr.medical_registration_number,
        dr.medical_council,
        dr.qualification,
        dr.specialization,
        dr.registration_expiry_date,
        dr.onboarding_status,
        dr.created_at AS registration__date,
        dr.medical_registration_certificate,
        dr.medical_degree_certificate,
        dr.government_id_proof,
        dr.selfie
      FROM doctor_registrations dr
      ${whereClause}
      ORDER BY dr.created_at DESC
      LIMIT ${safeLimit}
      OFFSET ${offset}
    `;

    const [rows] = await db.execute(
      dataSql,
      params
    );

    return {
      rows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(
        total / safeLimit
      ),
    };

  } catch (error) {
    console.error(
      "Get Doctor Registrations Model Error:",
      error
    );

    throw error;
  }
};

exports.getRegistrationStats = async (conn = db) => {
  const sql = `
    SELECT
      COUNT(*) AS total_registered,

      COALESCE(
        SUM(onboarding_status = 'SUBMITTED'),
        0
      ) AS total_submitted,

      COALESCE(
        SUM(onboarding_status = 'DRAFT'),
        0
      ) AS total_draft,

      COALESCE(
        SUM(onboarding_status = 'VERIFIED'),
        0
      ) AS total_verified,

      COALESCE(
        SUM(onboarding_status = 'REJECTED'),
        0
      ) AS total_rejected

    FROM doctor_registrations
  `;

  const [rows] = await conn.execute(sql);

  return {
    total_registered: Number(rows[0]?.total_registered || 0),
    total_submitted: Number(rows[0]?.total_submitted || 0),
    total_draft: Number(rows[0]?.total_draft || 0),
    total_verified: Number(rows[0]?.total_verified || 0),
    total_rejected: Number(rows[0]?.total_rejected || 0),
  };
};