const express = require("express");
const router = express.Router();

const { register, verifyEmail, getUsers, getUserByDoctorId } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController");
const { validateRegister, validateLogin } = require("../middlewares/validationMiddleware");
const { refreshTokenController } = require("../controllers/auth/refreshController");
const verifyToken = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", validateRegister, register);
router.get("/verify-email", verifyEmail);
router.post("/login", validateLogin, login);
router.post("/refresh", refreshTokenController);


module.exports = router;