const Joi = require("joi");

exports.connectDoctorQrValidation = Joi.object({
    qrCodes: Joi.array()
        .items(
            Joi.string()
                .trim()
                .pattern(/^DR-[A-Z0-9]+$/)
                .messages({
                    "string.empty": "QR Code cannot be empty.",
                    "string.pattern.base":
                        "Invalid QR Code format."
                })
        )
        .min(1)
        .max(50)
        .unique()
        .required()
        .messages({
            "array.base":
                "QR Codes must be an array.",

            "array.min":
                "At least one QR Code is required.",

            "array.max":
                "Maximum 50 QR codes can be connected at once.",

            "array.unique":
                "Duplicate QR Codes are not allowed.",

            "any.required":
                "QR Codes array is required."
        })
});

exports.scanQrValidation = Joi.object({
  qrCode: Joi.string().trim().required().messages({
    "string.empty": "QR Code is required.",
    "any.required": "QR Code is required."
  })
});

