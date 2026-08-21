const express = require("express");
const router = express.Router();

const doctorRegistrationController = require("../../controllers/doctorVerification/doctorRegistrationController");
const doctorRegistrationValidation = require("../../validation/doctorVerification/doctorRegistrationValidation");

const validate = require("../../middlewares/validate.middleware");
const { verifyToken } = require("../../middlewares/authMiddleware");
const {allowRoles}=require("../../middlewares/role");

router.post(
    "/create",
    validate(doctorRegistrationValidation.createDoctorRegistrationValidation),
    doctorRegistrationController.createDoctorRegistration
);

router.get(
    "/getAllDoctorRegistrations",
    doctorRegistrationController.getAllDoctorRegistrations
);


router.get(
    "/getDoctorRegistrationById/:id",
    doctorRegistrationController.getDoctorRegistrationById
);

router.put(
    "/:id",
    validate(doctorRegistrationValidation.updateDoctorRegistration),
    doctorRegistrationController.updateDoctorRegistration
);

router.put(
    "/:id/submit",
    doctorRegistrationController.submitDoctorRegistration
);

router.delete(
    "/:id",
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

router.post(
  "/registration/upload-documents",
  doctorRegistrationController.uploadRegistrationDocuments
);

router.get(
  "/getregistration-documents/:id",
  doctorRegistrationController.getRegistrationDocuments
);

router.get(
  "/search",
  verifyToken,
  doctorRegistrationController.getDoctorRegistrations
);

module.exports = router;