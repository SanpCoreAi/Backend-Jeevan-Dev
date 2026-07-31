const Joi = require("joi");

exports.connectDoctorQrValidation = Joi.object({

    doctorId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({

            "number.base":
            "Doctor ID must be a number.",

            "number.integer":
            "Doctor ID must be integer.",

            "number.positive":
            "Doctor ID must be positive.",

            "any.required":
            "Doctor ID is required."

        }),



    qrCodes: Joi.array()
        .items(

            Joi.string()
                .trim()
                .pattern(/^(QR|DR)-[A-Z0-9]+$/)
                .messages({

                    "string.pattern.base":
                    "Invalid QR Code format."

                })

        )
        .min(1)
        .max(50)
        .required()
        .messages({

            "array.base":
            "QR Codes must be an array.",

            "array.min":
            "At least one QR Code is required.",

            "array.max":
            "Maximum 50 QR Codes allowed.",

            "any.required":
            "QR Codes are required."

        })


});

exports.scanQrValidation = Joi.object({
  qrCode: Joi.string().trim().required().messages({
    "string.empty": "QR Code is required.",
    "any.required": "QR Code is required."
  })
});

