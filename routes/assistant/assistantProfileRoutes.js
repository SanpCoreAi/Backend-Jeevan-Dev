const express = require("express");
const router = express.Router();

const { verifyToken } =
  require("../../middlewares/authMiddleware");

  const { allowRoles } =
  require("../../middlewares/role");

const assistantProfileController =
require("../../controllers/assistant/assistantProfileController");


router.get(
  "/getAssistantProfile",
  verifyToken,
  assistantProfileController.getAssistantProfile
);

router.get(
  "/getAllAssistantProfile",
  verifyToken, allowRoles(4),
  assistantProfileController.getAllAssistantProfile
);

router.patch(
  "/updateAssistantProfile",
  verifyToken,allowRoles(3),
  assistantProfileController.updateAssistantProfile
);

router.get(
  "/getAllAssistantProfiles/:doctorId",
  verifyToken,
  assistantProfileController.getAllAssistantProfiles
);

module.exports = router;