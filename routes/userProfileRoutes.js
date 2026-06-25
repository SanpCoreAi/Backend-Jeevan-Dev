const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const userProfileController = require("../controllers/users/userProfileController");

router.post("/createProfile", verifyToken, userProfileController.createUserProfile);

router.get("/getProfile", verifyToken, userProfileController.getUserProfile);

router.put("/updateProfile", verifyToken, userProfileController.updateUserProfile);

router.patch("/updateProfile", verifyToken, userProfileController.updateUserProfile);

// routes/userProfileRoutes.js

router.get(
  "/patient-card/:patientId",
  verifyToken,
  userProfileController.getPatientCardProfile
);

router.get(
  "/getPatientDetails",
  verifyToken,
  userProfileController.getPatientDetails
);

module.exports = router;