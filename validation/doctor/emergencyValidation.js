const Joi = require("joi");

exports.sendEmergencyValidation = Joi.object({

  doctor_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "Doctor ID must be a number.",
      "number.integer": "Doctor ID must be an integer.",
      "number.positive": "Doctor ID must be positive.",
      "any.required": "Doctor ID is required.",
    }),

  role_id: Joi.number()
    .valid(2, 3)
    .required()
    .messages({
      "any.only": "Role ID must be 2 (Doctor) or 3 (Assistant).",
      "any.required": "Role ID is required.",
    }),

  message: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      "string.empty": "Message is required.",
      "string.min": "Message cannot be empty.",
      "string.max": "Message must not exceed 500 characters.",
      "any.required": "Message is required.",
    }),

});


exports.getUserEmergenciesValidation = Joi.object({

  doctor_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "Doctor ID must be a number.",
      "number.integer": "Doctor ID must be an integer.",
      "number.positive": "Doctor ID must be positive.",
      "any.required": "Doctor ID is required.",
    }),

});