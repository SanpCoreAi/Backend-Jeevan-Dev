const Joi = require("joi");
const AppError = require("../utils/appError");

const { body } = require("express-validator");

exports.validateRegister = [
  body("full_name").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone_number").notEmpty().withMessage("Phone number is required"),
];

exports.validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.validateEmergency = (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim().length < 3) {
    return next(new AppError("Message is required and must be at least 3 characters", 400));
  }

  next();
};

exports.validateDoctorData = (req, res, next) => {
  const {
    name,
    username,
    email,
    specialization,
    qualification,
    experience,
    language,
    phoneNumber,
    consultationFee,
    medicalLicenseNo,
    address,
    hospitalName,
    bio,
  } = req.body;

  // Email format check only if email is provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }
  }

  // Experience validation
  if (experience && isNaN(experience)) {
    return res.status(400).json({
      success: false,
      message: "Experience must be a number.",
    });
  }

  // Consultation fee validation
  if (consultationFee && isNaN(consultationFee)) {
    return res.status(400).json({
      success: false,
      message: "Consultation fee must be numeric.",
    });
  }

  // You can optionally validate other required doctor fields like specialization, qualification, etc.
  next();
};
