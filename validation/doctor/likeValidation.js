const Joi = require("joi");

const toggleLikeSchema = Joi.object({
  doctorId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "doctorId is required",
      "number.base": "doctorId must be a number",
      "number.integer": "doctorId must be an integer",
      "number.positive": "doctorId must be greater than 0",
    }),
});

const likedDoctorsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
});

const tokenSchema = Joi.object({
  token: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "token is required",
      "string.empty": "token is required",
    }),
});

module.exports = {
  toggleLikeSchema,
  likedDoctorsSchema,
  tokenSchema,
};