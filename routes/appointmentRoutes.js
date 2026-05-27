const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/doctor/appointmentController");
const {verifyToken} = require("../middlewares/authMiddleware");
const controller = require("../controllers/doctor/qrAppointmentController");
const { body, param } = require("express-validator");
const ctrl = require("../controllers/doctor/appointmentTokenController");
const validate = require("../middlewares/validationMiddleware");
const appointmentTokenController = require("../controllers/doctor/appointmentTokenController")

router.post("/create/:doctorId", verifyToken, appointmentController.create);

router.post("/scan-book/:doctorId", verifyToken, controller.scanBook);
router.get("/appointment/:appointmentId", verifyToken,appointmentController.getAppointmentById);

router.get("/view-e-visit", verifyToken, appointmentController.getDoctorAppointmentsForTable);

router.get("/getAllappoinment/my", verifyToken, appointmentController.getMyAppointments);
router.get("/getAppointmentById", verifyToken, appointmentController.getAppointmentById);
router.get("/getAppointmentPublicById/:patient_id", verifyToken, appointmentController.getAppointmentPublicById);


router.get("/token/:token", ctrl.verifyToken);
router.post("/:id/start", verifyToken, ctrl.start);
// router.get("/:id", verifyToken, ctrl.getDetails);
router.post("/:id/complete", verifyToken, ctrl.complete);
router.get("/revisit/:patientId/:doctorId", verifyToken, ctrl.revisit);
router.get( "/doctor/table", verifyToken, appointmentController.getDoctorAppointmentsForTable
);


router.get("/prescription", verifyToken, appointmentTokenController.getPrescription);
router.get("/verify-token/:token", verifyToken, appointmentTokenController.verifyToken);


router.get(
  "/today-appointments",
  verifyToken,
  appointmentController.getTodayAppointments
);


module.exports = router;