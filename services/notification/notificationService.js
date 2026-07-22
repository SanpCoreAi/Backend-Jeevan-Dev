const notificationModel = require("../../models/notification/notificationModel");

exports.createNotification = async (payload) => {

    const notification = {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || "INFO",
        createdBy: payload.createdBy
    };

    return await notificationModel.create(notification);

};


exports.getNotifications = async ({
    userId,
    page,
    limit,
    search,
    isRead
}) => {

    const offset = (page - 1) * limit;

    const notifications = await notificationModel.findAll({
        userId,
        limit,
        offset,
        search,
        isRead
    });


    const total = await notificationModel.count({
        userId,
        search,
        isRead
    });

    return {
  
        data: notifications,

        pagination: {

            page,

            limit,

            total,

            totalPages: Math.ceil(total / limit)

        }

    };

};


exports.getNotificationById = async (notificationId, userId) => {

    return await notificationModel.findById(
        notificationId,
        userId
    );

};


exports.updateNotification = async (
    notificationId,
    payload
) => {

    const exists = await notificationModel.findByNotificationId(
        notificationId
    );

    if (!exists) {

        return null;

    }

    await notificationModel.update(
        notificationId,
        payload
    );

    return true;

};


exports.markAsRead = async (
    notificationId,
    userId
) => {

    const exists = await notificationModel.findById(
        notificationId,
        userId
    );

    if (!exists) {

        return null;

    }

    await notificationModel.markAsRead(
        notificationId
    );

    return true;

};


exports.markAllRead = async (userId) => {

    return await notificationModel.markAllRead(
        userId
    );

};


exports.deleteNotification = async (
    notificationId,
    deletedBy
) => {

    const exists = await notificationModel.findByNotificationId(
        notificationId
    );

    if (!exists) {

        return null;

    }

    await notificationModel.softDelete(
        notificationId,
        deletedBy
    );

    return true;

};