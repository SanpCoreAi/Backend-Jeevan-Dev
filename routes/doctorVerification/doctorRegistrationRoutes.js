const express = require("express");
const router = express.Router();

const doctorRegistrationController = require("../../controllers/doctorVerification/doctorRegistrationController");
const doctorRegistrationValidation = require("../../validation/doctorVerification/doctorRegistrationValidation");

const validate = require("../../middlewares/validate.middleware");
const { verifyToken } = require("../../middlewares/authMiddleware");

router.post(
    "/create",
    verifyToken,
    validate(doctorRegistrationValidation.createDoctorRegistration),
    doctorRegistrationController.createDoctorRegistration
);

router.get(
    "/",
    verifyToken,
    doctorRegistrationController.getAllDoctorRegistrations
);


router.get(
    "/:id",
    verifyToken,
    doctorRegistrationController.getDoctorRegistrationById
);

router.put(
    "/:id",
    verifyToken,
    validate(doctorRegistrationValidation.updateDoctorRegistration),
    doctorRegistrationController.updateDoctorRegistration
);

router.put(
    "/:id/submit",
    verifyToken,
    doctorRegistrationController.submitDoctorRegistration
);

router.delete(
    "/:id",
    verifyToken,
    doctorRegistrationController.deleteDoctorRegistration
);

router.post(
    "/send-email-otp",
    validate(doctorRegistrationValidation.sendEmailOtp),
    doctorRegistrationController.sendEmailOtp
);

router.post(
    "/verify-email-otp",
    validate(doctorRegistrationValidation.verifyEmailOtp),
    doctorRegistrationController.verifyEmailOtp
);

module.exports = router;