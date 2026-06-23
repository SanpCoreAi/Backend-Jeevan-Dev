const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/doctor/dashboardController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {allowRoles}=require("../middlewares/role");

router.get(
  "/appointment-graph",
  verifyToken,allowRoles(2,3),
  dashboardController.appointmentGraph
);

router.get(
  "/today-stats",
  verifyToken,allowRoles(2,3),
  dashboardController.todayAppointmentStats
);

module.exports = router;