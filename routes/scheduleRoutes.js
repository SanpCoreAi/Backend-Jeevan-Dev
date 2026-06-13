const router = require("express").Router();
const ctrl = require("../controllers/doctor/scheduleController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/createSchedule", verifyToken, ctrl.create);

router.get("/getAllSchedules", verifyToken, ctrl.getAll);

router.get("/getScheduleById", verifyToken, ctrl.getByDoctorId);

// public endpoint - no authentication required
router.get("/getSchedulePublicByDoctorId/:doctorId", ctrl.getSchedulePublicByDoctorId);

router.get('/getHospitalsName', verifyToken, ctrl.getHospitals);

router.put("/updateSchedule/:id", verifyToken, ctrl.update);

router.delete("/deleteSchedule/:id", verifyToken, ctrl.remove);

module.exports = router;