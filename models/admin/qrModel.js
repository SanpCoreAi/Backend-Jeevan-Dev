const db = require("../../config/db");

exports.getLastQrCode = async () => {
    const sql = `
        SELECT qr_code
        FROM qr_codes
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] = await db.execute(sql);

    return rows.length ? rows[0] : null;
};

exports.bulkInsert = async (qrData) => {

    const sql = `
        INSERT INTO qr_codes
        (
            qr_code,
            qr_image,
            status
        )
        VALUES ?
    `;

    const values = qrData.map((item) => [
        item.qrCode,
        item.imagePath,
        "AVAILABLE"
    ]);

    const [result] = await db.query(sql, [values]);

    return {
        affectedRows: result.affectedRows
    };
};

exports.findDoctorByUserId = async (doctorId) => {

    const sql = `
        SELECT
            id,
            user_id,
            qr_code
        FROM doctors
        WHERE user_id = ?
        LIMIT 1
    `;

    const [rows] = await db.execute(sql, [doctorId]);

    return rows.length ? rows[0] : null;
};

exports.findQrCode = async (qrCode) => {

    const sql = `
        SELECT *
        FROM qr_codes
        WHERE qr_code = ?
        LIMIT 1
    `;

    const [rows] = await db.execute(sql, [qrCode]);

    return rows.length ? rows[0] : null;
};

exports.assignQrToDoctor = async (
    connection,
    doctorId,
    qrCode,
    qrImage,
    qrUrl
) => {

    const sql = `
        UPDATE doctors
        SET
            qr_code = ?,
            qr_code_image = ?,
            qr_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `;

    return connection.execute(sql, [
        qrCode,
        qrImage,
        qrUrl,
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
            status='ASSIGNED',
            doctor_user_id=?,
            assigned_at=NOW()
        WHERE qr_code=?
    `;

    return connection.execute(sql, [
        doctorId,
        qrCode
    ]);
};

exports.getAllQrCodes = async ({
    limit,
    offset,
    status
}) => {

    let where = "";
    const params = [];

    if (status) {
        where = "WHERE status = ?";
        params.push(status);
    }

    const countSql = `
        SELECT COUNT(*) AS total
        FROM qr_codes
        ${where}
    `;

    const [countRows] = await db.execute(countSql, params);

    const sql = `
        SELECT
            id,
            qr_code,
            qr_image,
            CONCAT('http://localhost:4000/', qr_image) AS qr_image_url,
            CONCAT('http://localhost:4000/api/QR/scan/', qr_code) AS qr_url,
            status,
            doctor_user_id,
            assigned_at,
            created_at
        FROM qr_codes
        ${where}
        ORDER BY id DESC
        LIMIT ${Number(limit)}
        OFFSET ${Number(offset)}
    `;

    const [rows] = await db.execute(sql, params);

    return {
        rows,
        total: countRows[0].total
    };
};

exports.getDoctorQrCodes = async (doctorId) => {

    const sql = `
        SELECT
            id,
            qr_code,
            qr_image,
            CONCAT(
                'http://localhost:4000/uploads/qrcodes/',
                SUBSTRING_INDEX(qr_image,'/',-1)
            ) AS qr_image_url,
            CONCAT(
                'http://localhost:4000/api/QR/scan/',
                qr_code
            ) AS qr_url,
            status,
            assigned_at
        FROM qr_codes
        WHERE doctor_user_id = ?
        ORDER BY id DESC
    `;

    const [rows] = await db.execute(sql, [doctorId]);

    return rows;
};

exports.getAllQrDetails = async ({
    limit,
    offset,
    status
}) => {

    let where = "";
    const params = [];

    if (status) {
        where = "WHERE q.status = ?";
        params.push(status);
    }

    const countSql = `
        SELECT COUNT(*) AS total
        FROM qr_codes q
        ${where}
    `;

    const [countRows] = await db.execute(countSql, params);

    const sql = `
        SELECT
            q.id,
            q.qr_code,
            q.qr_image,
            CONCAT('http://localhost:4000/', q.qr_image) AS qr_image_url,
            CONCAT('http://localhost:4000/api/QR/scan/', q.qr_code) AS qr_url,
            q.status,
            q.doctor_user_id,
            q.assigned_at,
            q.created_at,

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
        total: countRows[0].total
    };
};