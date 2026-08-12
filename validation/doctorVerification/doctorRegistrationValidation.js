const Joi = require("joi");

exports.createDoctorRegistrationValidation = Joi.object({

  registrationId: Joi.number()
    .integer()
    .positive()
    .optional(),

  fullName: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHER")
    .optional(),

  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .optional(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(150)
    .optional(),

  mobile: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),

  medicalRegistrationNumber: Joi.string()
    .trim()
    .max(100)
    .optional(),

  medicalCouncil: Joi.string()
    .trim()
    .max(150)
    .optional(),

  qualification: Joi.string()
    .trim()
    .max(150)
    .optional(),

  specialization: Joi.string()
    .trim()
    .max(150)
    .optional(),

  registrationExpiryDate: Joi.date()
    .iso()
    .optional(),

}).unknown(false);

exports.updateDoctorRegistration = Joi.object({

    fullName: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .optional(),

    gender: Joi.string()
        .valid("MALE", "FEMALE", "OTHER")
        .optional(),

    age: Joi.number()
        .integer()
        .min(18)
        .max(100)
        .optional(),

    email: Joi.string()
        .email()
        .trim()
        .optional(),

    mobile: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .optional(),

    medicalRegistrationNumber: Joi.string()
        .trim()
        .max(100)
        .optional(),

    medicalCouncil: Joi.string()
        .trim()
        .max(150)
        .optional(),

    qualification: Joi.string()
        .trim()
        .max(150)
        .optional(),

    specialization: Joi.string()
        .trim()
        .max(150)
        .optional(),

    registrationExpiryDate: Joi.date()
        .allow(null)
        .optional()

}).min(1).messages({
    "object.min": "At least one field is required for update."
});

exports.sendEmailOtp = Joi.object({

    email: Joi.string()
        .email()
        .required()

});

exports.verifyEmailOtp = Joi.object({

    email: Joi.string()
        .email()
        .required(),

    otp: Joi.string()
        .length(6)
        .required()

});

exports.uploadRegistrationDocumentValidation = Joi.object({
  documentType: Joi.string()
    .valid(
      "medicalRegistrationCertificate",
      "medicalDegreeCertificate",
      "governmentIdProof",
      "selfie"
    )
    .required()
    .messages({
      "any.required": "Document type is required.",
      "any.only": "Invalid document type."
    })
});