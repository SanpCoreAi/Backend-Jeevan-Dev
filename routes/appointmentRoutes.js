const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/doctor/appointmentController");
const {verifyToken} = require("../middlewares/authMiddleware");
const controller = require("../controllers/doctor/qrAppointmentController");
const { body, param } = require("express-validator");
const ctrl = require("../controllers/doctor/appointmentTokenController");
const validate = require("../middlewares/validationMiddleware");
const appointmentTokenController = require("../controllers/doctor/appointmentTokenController");
const {allowRoles}=require("../middlewares/role");


router.post("/create/:doctorId", verifyToken, appointmentController.create);

router.post("/scan-book/:doctorId", verifyToken, controller.scanBook);
router.get(
  "/appointment/:appointmentId",
  verifyToken,
  appointmentController.getAppointmentDetails
);

router.get("/view-e-visit", verifyToken,allowRoles(2,3), appointmentController.getDoctorAppointmentsForTable);

router.get("/getAllappoinment/my", verifyToken,allowRoles(1,2,3), appointmentController.getMyAppointments);
router.get(
  "/getAppointmentById",
  verifyToken,
  appointmentController.getAppointmentById
);
router.get("/getAppointmentPublicById/:patient_id", verifyToken, appointmentController.getAppointmentPublicById);

router.get("/doctor-slots",verifyToken, appointmentController.getDoctorSlots);

router.get(
  "/:appointmentId/token/:token",
  verifyToken,
  ctrl.verifyToken
);
router.post("/:id/start", verifyToken, ctrl.start);
// router.get("/:id", verifyToken, ctrl.getDetails);
router.post("/:id/complete", verifyToken, ctrl.complete);
router.get("/revisit/:patientId/:doctorId", verifyToken, ctrl.revisit);
router.get( "/doctor/table", verifyToken, appointmentController.getDoctorAppointmentsForTable
);


router.get("/prescription", verifyToken, allowRoles(1, 2), appointmentTokenController.getPrescription);

router.get("/verify-token/:token", verifyToken, appointmentTokenController.verifyToken);

router.get(
  "/today-appointments",
  verifyToken,allowRoles(2,3),
  appointmentController.getTodayAppointments
);

router.post(
  "/bookAppointmentByAssistant",
  verifyToken,
  appointmentController.bookAppointmentByAssistant
);

router.get(
  "/dashboard-cards",
  verifyToken,allowRoles(2,3),
  appointmentController.getDashboardCards
);


router.get(
  "/dashboard/stats",
  verifyToken,allowRoles(2,3),
  appointmentController.getDashboardStats
);


router.get(
  "/patient-dashboard-cards",
  verifyToken,allowRoles(2,3),
  appointmentController
    .getPatientDashboardCards
);


router.patch(
  "/:appointmentId/cancel",
  verifyToken,
  allowRoles(1),
  appointmentController.cancelAppointment
);

module.exports = router;