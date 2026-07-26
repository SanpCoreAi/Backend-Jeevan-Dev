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


const searchDoctorSchema = Joi.object({
  search: Joi.string().trim().allow("").max(100).optional(),
  q: Joi.string().trim().allow("").max(100).optional(),
  keyword: Joi.string().trim().allow("").max(100).optional(),

  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(10),

  sortBy: Joi.string()
    .valid(
      "experience",
      "consultationFee",
      "avgRating",
      "fullName"
    )
    .default("experience"),

  order: Joi.string()
    .valid("asc", "desc")
    .default("desc")
}).unknown(false);

module.exports = {
  getDoctorsSchema,
  searchDoctorSchema
};