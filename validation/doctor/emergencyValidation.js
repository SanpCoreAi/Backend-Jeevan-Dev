// validation/emergencyValidation.js
const Joi = require("joi");

exports.emergencySchema = Joi.object({
  message: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      "string.empty": "Message cannot be empty",
      "string.min": "Message must be at least 5 characters",
      "string.max": "Message cannot exceed 255 characters",
      "any.required": "Message is required",
    }),
});
