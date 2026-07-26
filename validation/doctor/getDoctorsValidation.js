const Joi = require("joi");

const getDoctorsSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  email: Joi.string()
    .trim()
    .email()
    .max(255)
    .optional(),

  phone_number: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .message("phone_number must contain 10 to 15 digits.")
    .optional(),

  specialization: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
}).unknown(false);

module.exports = {
  getDoctorsSchema
};