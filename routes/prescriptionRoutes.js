const router = require("express").Router();
const ctrl = require("../controllers/doctor/prescriptionController");

const {verifyToken} = require("../middlewares/authMiddleware")

router.post("/", verifyToken, ctrl.save);

router.put("/update/:appointmentId", ctrl.update);

module.exports = router;