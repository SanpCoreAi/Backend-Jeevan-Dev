const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/doctor/dashboardController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get(
  "/appointment-graph",
  verifyToken,
  dashboardController.appointmentGraph
);

router.get(
  "/today-stats",
  verifyToken,
  dashboardController.todayAppointmentStats
);

module.exports = router;