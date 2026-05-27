const express = require("express");
const { sendEmergency, getUserEmergencies} = require("../controllers/doctor/emergencyController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/send", verifyToken, sendEmergency);
router.get("/user/:user_id", verifyToken, getUserEmergencies);

module.exports = router;