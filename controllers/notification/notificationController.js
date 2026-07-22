const notificationService = require("../../services/notification/notificationService");

exports.createNotification = async (req, res) => {
    try {
        const createdBy = req.user.id;
        const payload = {
            ...req.body,
            createdBy
        };

        const result = await notificationService.createNotification(payload);
        return res.status(201).json({
            success: true,
            message: "Notification created successfully.",
            data: result
        });

    } catch (error) {
        console.error("Create Notification Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }
};

exports.getNotifications = async (req, res) => {

    try {

        const userId = req.user.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const isRead = req.query.isRead;
        const result = await notificationService.getNotifications({
            userId,
            page,
            limit,
            search,
            isRead
        });

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully.",
            ...result
        });

    } catch (error) {

        console.error("Get Notifications Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }

};

exports.getNotificationById = async (req, res) => {

    try {

        const notificationId = Number(req.params.id);
        const userId = req.user.id;
        const result = await notificationService.getNotificationById(
            notificationId,
            userId
        );

        if (!result) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });

        }

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }

};


exports.updateNotification = async (req, res) => {

    try {

        const notificationId = Number(req.params.id);
        const updatedBy = req.user.id;
        const payload = {

            ...req.body,

            updatedBy

        };

        const result = await notificationService.updateNotification(
            notificationId,
            payload
        );

        if (!result) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });

        }

        return res.status(200).json({

            success: true,
            message: "Notification updated successfully."

        });

    } catch (error) {

        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."

        });

    }

};


exports.markAsRead = async (req, res) => {

    try {

        const notificationId = Number(req.params.id);
        const userId = req.user.id;
        const result = await notificationService.markAsRead(
            notificationId,
            userId
        );

        if (!result) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read."
        });

    } catch (error) {

        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }

};

exports.markAllRead = async (req, res) => {

    try {

        const userId = req.user.id;
        await notificationService.markAllRead(userId);
        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."

        });

    } catch (error) {

        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."

        });

    }

};


exports.deleteNotification = async (req, res) => {

    try {

        const notificationId = Number(req.params.id);
        const deletedBy = req.user.id;

        const result = await notificationService.deleteNotification(
            notificationId,
            deletedBy
        );

        if (!result) {

            return res.status(404).json({

                success: false,
                message: "Notification not found."

            });

        }

        return res.status(200).json({

            success: true,
            message: "Notification deleted successfully."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."

        });
    }
};