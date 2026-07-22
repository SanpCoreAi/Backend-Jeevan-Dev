const express = require("express");

const router = express.Router();

const notificationController = require("../../controllers/notification/notificationController");

const {verifyToken} = require("../../middlewares/authMiddleware");

const {allowRoles} = require("../../middlewares/role");

const {validateRequest} = require("../../middlewares/validateRequest");

const {
    createNotificationSchema,
    updateNotificationSchema
} = require("../../validation/notification/notification.validation");

router.post(
    "/create",
    verifyToken,
    allowRoles(1,2,3,4),
    validateRequest(createNotificationSchema),
    notificationController.createNotification
);

router.get(
    "/getNotifications",
    verifyToken,
    notificationController.getNotifications
);

router.get(
    "/getNotificationById/:id",
    verifyToken,
    notificationController.getNotificationById
);


router.put(
    "/updateNotification/:id",
    verifyToken,
    allowRoles(4),
    validateRequest(updateNotificationSchema),
    notificationController.updateNotification
);

router.patch(
    "/:id/read",
    verifyToken,
    notificationController.markAsRead
);

router.patch(
    "/read-all",
    verifyToken,
    notificationController.markAllRead
);

router.delete(
    "/delete/:id",
    verifyToken,
    allowRoles(4),
    notificationController.deleteNotification
);

module.exports = router;