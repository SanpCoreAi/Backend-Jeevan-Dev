const express = require("express");
const router = express.Router();
const { register, verifyEmail, getUsers, getUserByDoctorId } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController");
const { validateRegister, validateLogin } = require("../middlewares/validationMiddleware");

// Routes
router.post("/register", validateRegister, register);
router.get("/verify-email", verifyEmail); 
router.post("/login", validateLogin, login);
router.get("/getUserByDoctorAssistant/:doctorId", getUserByDoctorId);
router.get("/get-users", getUsers);

module.exports = router;