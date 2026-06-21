const express = require("express");
const router = express.Router();

const { register, verifyEmail, getUsers, getUserByDoctorId, getUserByDoctorAssistant, getAssistantStats} = require("../controllers/auth/registerController");

const { login } = require("../controllers/auth/loginController");
const {forgotPassword}=require("../controllers/auth/forgotPasswordController");
const {resetPassword}=require("../controllers/auth/resetPasswordController");
const {changePassword}=require("../controllers/auth/changePasswordController");

const { validateRegister, validateLogin,} = require("../middlewares/validationMiddleware");

const {allowRoles}=require("../middlewares/role");

const { refreshTokenController,} = require("../controllers/auth/refreshController");

const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/register", validateRegister, register);

router.get("/verify-email", verifyEmail);

router.post("/login", validateLogin, login);

router.post( "/refresh", refreshTokenController);

router.get( "/getUsers", verifyToken, getUsers);

// router.get( "/users", verifyToken, allowRoles(1), getUsers);

router.get( "/getUserByDoctorId/:doctorId", verifyToken, getUserByDoctorId);

router.get( "/getUserByDoctorAssistant", verifyToken, getUserByDoctorAssistant);

router.get(
  "/assistant/stats",
  verifyToken,
  getAssistantStats
);


router.post(
"/forgot-password",
forgotPassword
);

router.post(
"/reset-password",
resetPassword
);

router.post(
"/change-password",
verifyToken,
changePassword
);

module.exports = router;