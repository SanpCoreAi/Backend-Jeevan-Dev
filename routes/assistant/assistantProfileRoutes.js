const express = require("express");
const router = express.Router();

const { verifyToken } =
  require("../../middlewares/authMiddleware");

const assistantProfileController =
require("../../controllers/assistant/assistantProfileController");

router.post(
  "/createAssistantProfile",
  verifyToken,
  assistantProfileController.createAssistantProfile
);

router.get(
  "/getAssistantProfile",
  verifyToken,
  assistantProfileController.getAssistantProfile
);

router.get(
  "/getAllAssistantProfiles",
  verifyToken,
  assistantProfileController.getAllAssistantProfiles
);

module.exports = router;