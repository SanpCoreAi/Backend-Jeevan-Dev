const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const userProfileController = require("../controllers/users/userProfileController");

router.post( "/user/profile", verifyToken, userProfileController.createUserProfile);

router.get( "/getViewPatientprofile", verifyToken, userProfileController.getPatientDetails);

module.exports = router;