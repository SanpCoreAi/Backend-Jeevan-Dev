const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const userProfileController = require("../controllers/users/userProfileController");

router.post("/createProfile", verifyToken, userProfileController.createUserProfile);

router.get("/getProfile", verifyToken, userProfileController.getUserProfile);

router.patch(
  "/updateProfile",
  verifyToken,
  userProfileController.updateUserProfile
);

router.get(
  "/patient-card/:patientId",
  verifyToken,
  userProfileController.getPatientCardProfile
);

router.get(
  "/getPatientDetails/:appointmentId",
  verifyToken,
  userProfileController.getPatientDetails
);

router.get(
  "/getAllUsers",
  verifyToken,
  userProfileController.getAllUsers
);

module.exports = router;