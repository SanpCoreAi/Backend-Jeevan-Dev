const Joi = require("joi");

exports.createDoctorRegistration = Joi.object({

    fullName: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            "string.base": "Full name must be a string.",
            "string.empty": "Full name is required.",
            "string.min": "Full name must be at least 3 characters.",
            "string.max": "Full name must not exceed 100 characters.",
            "any.required": "Full name is required."
        }),

    gender: Joi.string()
        .valid("MALE", "FEMALE", "OTHER")
        .required()
        .messages({
            "any.only": "Gender must be MALE, FEMALE or OTHER.",
            "any.required": "Gender is required."
        }),

    age: Joi.number()
        .integer()
        .min(18)
        .max(100)
        .required()
        .messages({
            "number.base": "Age must be a number.",
            "number.min": "Age must be at least 18 years.",
            "number.max": "Age must not exceed 100 years.",
            "any.required": "Age is required."
        }),

    email: Joi.string()
        .email()
        .trim()
        .required()
        .messages({
            "string.email": "Please enter a valid email.",
            "any.required": "Email is required."
        }),

    mobile: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            "string.pattern.base": "Please enter a valid 10-digit mobile number.",
            "any.required": "Mobile number is required."
        }),

    medicalRegistrationNumber: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            "string.empty": "Medical registration number is required.",
            "any.required": "Medical registration number is required."
        }),

    medicalCouncil: Joi.string()
        .trim()
        .max(150)
        .required()
        .messages({
            "string.base": "Medical council must be a string.",
            "string.empty": "Medical council is required.",
            "string.max": "Medical council must not exceed 150 characters.",
            "any.required": "Medical council is required."
        }),

    qualification: Joi.string()
        .trim()
        .max(150)
        .required()
        .messages({
            "string.base": "Qualification must be a string.",
            "string.empty": "Qualification is required.",
            "string.max": "Qualification must not exceed 150 characters.",
            "any.required": "Qualification is required."
        }),

    specialization: Joi.string()
        .trim()
        .max(150)
        .required()
        .messages({
            "string.base": "Specialization must be a string.",
            "string.empty": "Specialization is required.",
            "string.max": "Specialization must not exceed 150 characters.",
            "any.required": "Specialization is required."
        }),

    registrationExpiryDate: Joi.date()
        .allow(null)
        .optional()
        .messages({
            "date.base": "Registration expiry date must be a valid date."
        })

});

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