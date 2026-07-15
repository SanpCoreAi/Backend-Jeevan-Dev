const Joi = require("joi");

exports.loginValidation = (data) => {

  const schema = Joi.object({

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(255)
      .required()
      .messages({
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email address",
        "string.max": "Email must not exceed 255 characters",
        "any.required": "Email is required",
      }),

    password: Joi.string()
      .trim()
      .min(8)
      .max(100)
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters",
        "string.max": "Password must not exceed 100 characters",
        "any.required": "Password is required",
      }),

  }).options({
    abortEarly: true,
    allowUnknown: false,
    stripUnknown: true,
  });

  const { error } = schema.validate(data);

  return error ? error.details[0].message : null;
};