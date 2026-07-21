const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const userProfileController = require("../controllers/users/userProfileController");
const {allowRoles}=require("../middlewares/role");

router.get("/getProfile", verifyToken, userProfileController.getUserProfile);

router.patch(
  "/updateProfile",
  verifyToken,
  userProfileController.updateUserProfile
);

router.get(
  "/patient-card/:patientId",
  verifyToken,allowRoles(1,2),
  userProfileController.getPatientCardProfile
);

router.get(
  "/getPatientDetails/:appointmentId",
  verifyToken,allowRoles(2),
  userProfileController.getPatientDetails
);

router.get(
  "/getAllUsers",
  verifyToken,allowRoles(4),
  userProfileController.getAllUsers
);

module.exports = router;