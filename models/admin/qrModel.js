const db = require("../../config/db");

exports.getLastQrCode = async () => {

    const sql = `
        SELECT 
            qr_code
        FROM qr_codes
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] = await db.execute(sql);

    return rows.length
        ? rows[0]
        : null;

};

exports.bulkInsert = async (
    qrData,
    connection = db
) => {


    const sql = `
        INSERT INTO qr_codes
        (
            qr_code,
            qr_image,
            status
        )
        VALUES ?
    `;


    const values = qrData.map(item => [

        item.qrCode,

        item.imagePath,

        "AVAILABLE"

    ]);



    const [result] = await connection.query(
        sql,
        [values]
    );



    return {

        insertedRows:
        result.affectedRows

    };

};


exports.findDoctorByUserId = async (

    connection = db,

    doctorId

) => {


    const sql = `
        SELECT
            id,
            user_id,
            qr_code
        FROM doctors
        WHERE user_id = ?
        LIMIT 1
    `;



    const [rows] = await connection.execute(

        sql,

        [doctorId]

    );



    return rows.length
        ? rows[0]
        : null;

};

exports.findQrCode = async (connectionOrQrCode, qrCode) => {

    let connection = db;

    if (typeof connectionOrQrCode === "string") {
        qrCode = connectionOrQrCode;
    } else {
        connection = connectionOrQrCode;
    }

    const sql = `
        SELECT
            id,
            qr_code,
            qr_image,
            status,
            doctor_user_id,
            assigned_at
        FROM qr_codes
        WHERE qr_code = ?
        LIMIT 1
    `;

    const [rows] = await connection.execute(sql, [qrCode]);

    return rows.length ? rows[0] : null;
};

exports.assignQrToDoctor = async (
    connection,
    doctorId,
    qrCode
) => {
    const sql = `
        UPDATE doctors
        SET
            qr_code = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `;

    return connection.execute(sql, [
        qrCode,
        doctorId
    ]);
};


exports.updateQrStatus = async (

    connection,

    qrCode,

    doctorId

) => {


    const sql = `
        UPDATE qr_codes
        SET
            status = 'ASSIGNED',
            doctor_user_id = ?,
            assigned_at = CURRENT_TIMESTAMP
        WHERE qr_code = ?
        AND status = 'AVAILABLE'
    `;



    const [result] = await connection.execute(

        sql,

        [

            doctorId,

            qrCode

        ]

    );



    return result;

};


exports.findByUserId = async (userId) => {

  const [rows] = await db.execute(
    `
    SELECT
      d.id,
      d.user_id,
      u.full_name,
      u.email,
      u.status
    FROM doctors d
    INNER JOIN users u
      ON d.user_id = u.id
    WHERE d.user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;

};

exports.getAllQrCodes = async ({

    limit,

    offset,

    status

}) => {

    let where = "";
    const params = [];

    if(status){

        where = "WHERE status = ?";

        params.push(status);

    }

    const countSql = `

        SELECT COUNT(*) AS total

        FROM qr_codes

        ${where}

    `;

    const [countRows] = await db.execute(

        countSql,

        params

    );

    const sql = `

        SELECT

            id,

            qr_code,

            qr_image,

            status,

            doctor_user_id,

            assigned_at,

            created_at


        FROM qr_codes

        ${where}


        ORDER BY id DESC


        LIMIT ?

        OFFSET ?

    `;




    const [rows] = await db.execute(

        sql,

        [

            ...params,

            Number(limit),

            Number(offset)

        ]

    );




    return {

        rows,

        total:
        countRows[0].total

    };


};


exports.getDoctorQrCodes = async (

    doctorId

) => {



    const sql = `

        SELECT

            id,

            qr_code,

            qr_image,

            status,

            assigned_at,

            created_at


        FROM qr_codes


        WHERE doctor_user_id = ?


        ORDER BY id DESC

    `;




    const [rows] = await db.execute(

        sql,

        [doctorId]

    );




    return rows;


};


exports.getAllQrDetails = async ({

    limit,

    offset,

    status

}) => {



    let where = "";

    const params = [];



    if(status){

        where = "WHERE q.status = ?";

        params.push(status);

    }





    const countSql = `

        SELECT COUNT(*) AS total

        FROM qr_codes q

        ${where}

    `;



    const [countRows] = await db.execute(

        countSql,

        params

    );

const sql = `
SELECT
    q.id,
    q.qr_code,
    q.qr_image,
    q.status,
    q.doctor_user_id,
    q.assigned_at,
    d.id AS doctor_id,
    d.specialization,
    d.qualification,
    u.full_name,
    u.email,
    u.phone_number
FROM qr_codes q
LEFT JOIN doctors d
    ON q.doctor_user_id = d.user_id
LEFT JOIN users u
    ON d.user_id = u.id
${where}
ORDER BY q.id DESC
LIMIT ${Number(limit)}
OFFSET ${Number(offset)}
`;

const [rows] = await db.execute(sql, params);

    return {

        rows,

        total:

        countRows[0].total

    };


};

exports.findDoctorByQr = async (qrCode) => {
  const [rows] = await db.execute(
    `
    SELECT
        d.id AS doctor_id,
        d.user_id AS doctor_user_id,
        d.username AS doctor_name,
        d.specialization,
        d.consultation_fee,
        d.language,
        d.hospital_detail,
        d.age,
        d.gender
    FROM qr_codes q
    INNER JOIN doctors d
        ON d.user_id = q.doctor_user_id
    WHERE q.qr_code = ?
      AND q.status = 'ASSIGNED'
    LIMIT 1
    `,
    [qrCode]
  );

  return rows[0] || null;
};

exports.getDoctorHospitals = async (doctorId) => {
  const [rows] = await db.execute(
    `SELECT hospital_detail
     FROM doctors
     WHERE id = ?`,
    [doctorId]
  );

  if (!rows.length) {
    return [];
  }

  const hospitalDetail = rows[0].hospital_detail;

  console.log("Hospital Detail:", hospitalDetail);
  console.log("Type:", typeof hospitalDetail);

  if (!hospitalDetail) {
    return [];
  }

  if (typeof hospitalDetail === "object") {
    return hospitalDetail;
  }

  return JSON.parse(hospitalDetail);
};

exports.updateStatus = async (
    doctorId,
    status
) => {

    const [result] =
        await db.execute(
            `
            UPDATE users
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                doctorId
            ]
        );

    return result;

};