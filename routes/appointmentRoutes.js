const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/doctor/appointmentController");
const {verifyToken} = require("../middlewares/authMiddleware");
const controller = require("../controllers/doctor/qrAppointmentController");

// BOOK appointment (user)
router.post("/create/:doctorId", verifyToken, appointmentController.create);

router.post("/scan-book/:doctorId", verifyToken, controller.scanBook);


router.get("/doctor/e-visit", verifyToken, appointmentController.getDoctorAppointmentsForTable);

router.get("/getAllappoinment/my", verifyToken, appointmentController.getMyAppointments);
router.get("/getAppointmentById", verifyToken, appointmentController.getAppointmentById);
router.get("/getAppointmentPublicById/:patient_id", verifyToken, appointmentController.getAppointmentPublicById);

module.exports = router;