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
      AND status = 'ACTIVE'
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
      AND status = 'ACTIVE'
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
      AND status = 'ACTIVE'
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
    WHERE phone = ?
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
         AND status = 'ACTIVE'
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
      onboarding_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
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
      AND status = 'ACTIVE'
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
      AND status = 'ACTIVE'
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

      medical_registration_certificate,
      medical_degree_certificate,
      government_id_proof,
      selfie,

      email_verified,
      onboarding_status,
      status,

      created_at,
      updated_at

    FROM doctor_registrations

    WHERE id = ?
      AND status = 'ACTIVE'

    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

exports.findAll = async (filters, conn = db) => {
  const {
    limit = 10,
    offset = 0,
    search = "",
    status,
  } = filters;

  const safeLimit = Math.max(
    1,
    Math.min(100, Number(limit) || 10)
  );

  const safeOffset = Math.max(
    0,
    Number(offset) || 0
  );

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
      registration_expiry_date,

      medical_registration_certificate,
      medical_degree_certificate,
      government_id_proof,
      selfie,

      email_verified,
      onboarding_status,
      status,

      created_at,
      updated_at

    FROM doctor_registrations

    WHERE status = 'ACTIVE'
  `;

  const params = [];

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

  if (status) {
    sql += `
      AND onboarding_status = ?
    `;

    params.push(status);
  }

  sql += `
    ORDER BY id DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;

  const [rows] = await conn.execute(
    sql,
    params
  );

  return rows;
};

exports.countAll = async (
  search = "",
  status,
  conn = db
) => {
  let sql = `
    SELECT COUNT(*) AS total
    FROM doctor_registrations
    WHERE status = 'ACTIVE'
  `;

  const params = [];

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

  if (status) {
    sql += `
      AND onboarding_status = ?
    `;

    params.push(status);
  }

  const [rows] = await conn.execute(
    sql,
    params
  );

  return Number(rows[0].total);
};

exports.update = async (id, data, conn = db) => {

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
        registrationExpiryDate
    } = data;

    await conn.execute(
        `UPDATE doctor_registrations
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
        registration_expiry_date = ?
     WHERE id = ?`,
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
            id
        ]
    );
};

exports.submit = async (id, conn = db) => {

    await conn.execute(
        `UPDATE doctor_registrations
         SET onboarding_status='SUBMITTED',
             updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [id]
    );

};

exports.delete = async (id, conn = db) => {

    await conn.execute(
        `UPDATE doctor_registrations
         SET status='INACTIVE',
             updated_at=CURRENT_TIMESTAMP
         WHERE id=?`,
        [id]
    );

};

exports.saveEmailOtp = async (email, otp, expiryOrConn = null, conn = db) => {
  // expiryOrConn may be either a Date (expiry) or a DB connection.
  let expiry = null;

  if (expiryOrConn && typeof expiryOrConn.execute === "function") {
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
      [otp, expiry, email]
    );
  } else {
    await conn.execute(
      `
      UPDATE doctor_registrations
      SET
        email_otp = ?,
        email_otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      WHERE email = ?
      `,
      [otp, email]
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
      selfie,
      status,
      created_at,
      updated_at
    FROM doctor_registrations
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [id]);

  return rows.length ? rows[0] : null;
};