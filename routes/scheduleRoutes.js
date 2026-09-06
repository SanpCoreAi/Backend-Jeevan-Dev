const router = require("express").Router();
const ctrl = require("../controllers/doctor/scheduleController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {allowRoles}=require("../middlewares/role");

router.post("/createSchedule", verifyToken, allowRoles(2), ctrl.create);

router.get("/getAllSchedules", verifyToken, allowRoles(2,3), ctrl.getAll);

router.get("/getScheduleById", verifyToken, allowRoles(2,3), ctrl.getByDoctorId);

router.get("/getSchedulePublicByDoctorId/:doctorId", ctrl.getSchedulePublicByDoctorId);

router.get('/getHospitalsName', verifyToken,allowRoles(2,3), ctrl.getHospitals);

router.put("/updateSchedule/:id", verifyToken,allowRoles(2), ctrl.update);

router.delete(
  "/Delete/:scheduleId",
  verifyToken,
  ctrl.deleteSchedule
);

router.patch(
  "/Activate/:scheduleId",
  verifyToken,
  ctrl.activateScheduleSlot
);

module.exports = router;