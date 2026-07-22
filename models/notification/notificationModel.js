const db = require("../../config/db");

exports.create = async ({
    userId,
    title,
    message,
    type,
    createdBy
}) => {

    const sql = `
        INSERT INTO notifications
        (
            user_id,
            title,
            message,
            type,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
        userId,
        title,
        message,
        type,
        createdBy
    ]);

    return {
        id: result.insertId
    };
};

exports.findAll = async ({
    userId,
    limit,
    offset,
    search,
    isRead
}) => {

let sql = `
SELECT
    id,
    title,
    message,
    type,
    is_read,
    created_at
FROM notifications
WHERE deleted_at IS NULL
AND user_id = ?
`;

const params = [userId];

if (search) {
    sql += ` AND (title LIKE ? OR message LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
}

if (isRead !== undefined && isRead !== "") {
    sql += ` AND is_read = ?`;
    params.push(Number(isRead));
}

sql += `
ORDER BY created_at DESC
LIMIT ${Number(offset)}, ${Number(limit)}
`;

const [rows] = await db.execute(sql, params);

return rows;
};

exports.count = async ({
    userId,
    search,
    isRead
}) => {

    let sql = `
        SELECT COUNT(*) AS total
        FROM notifications
        WHERE deleted_at IS NULL
        AND user_id = ?
    `;

    const params = [userId];

    if (search) {

        sql += `
            AND (
                title LIKE ?
                OR message LIKE ?
            )
        `;

        params.push(`%${search}%`);
        params.push(`%${search}%`);
    }

    if (isRead !== undefined) {

        sql += `
            AND is_read = ?
        `;

        params.push(Number(isRead));
    }

    const [rows] = await db.execute(sql, params);

    return rows[0].total;
};

exports.findById = async (
    notificationId,
    userId
) => {

    const sql = `
        SELECT *
        FROM notifications
        WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.execute(sql, [
        notificationId,
        userId
    ]);

    return rows[0] || null;
};

exports.findByNotificationId = async (
    notificationId
) => {

    const sql = `
        SELECT id
        FROM notifications
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.execute(sql, [
        notificationId
    ]);

    return rows[0] || null;
};

exports.update = async (
    notificationId,
    payload
) => {

    const sql = `
        UPDATE notifications
        SET
            title = ?,
            message = ?,
            type = ?,
            updated_by = ?
        WHERE id = ?
    `;

    await db.execute(sql, [

        payload.title,

        payload.message,

        payload.type,

        payload.updatedBy,

        notificationId

    ]);
};


exports.markAsRead = async (
    notificationId
) => {

    const sql = `
        UPDATE notifications
        SET
            is_read = 1
        WHERE id = ?
    `;

    await db.execute(sql, [
        notificationId
    ]);

};

exports.markAllRead = async (
    userId
) => {

    const sql = `
        UPDATE notifications
        SET
            is_read = 1
        WHERE user_id = ?
        AND deleted_at IS NULL
    `;

    await db.execute(sql, [
        userId
    ]);

};

exports.softDelete = async (
    notificationId,
    deletedBy
) => {

    const sql = `
        UPDATE notifications
        SET
            deleted_at = NOW(),
            updated_by = ?
        WHERE id = ?
    `;

    await db.execute(sql, [
        deletedBy,
        notificationId
    ]);

};