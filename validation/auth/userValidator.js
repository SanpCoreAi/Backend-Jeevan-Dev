const Joi = require("joi");

exports.registerValidation = (data) => {

  const schema = Joi.object({

    full_name: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        "string.empty":
          "Full name is required",
        "any.required":
          "Full name is required",
      }),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .required()
      .messages({
        "string.empty":
          "Email is required",
        "string.email":
          "Please enter a valid email",
        "any.required":
          "Email is required",
      }),

    phone_number: Joi.string()
      .trim()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({
        "string.empty":
          "Phone number is required",
        "string.pattern.base":
          "Please enter a valid 10 digit phone number",
        "any.required":
          "Phone number is required",
      }),

    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/
      )
      .optional()
      .messages({
        "string.min":
          "Password must be at least 8 characters",
        "string.max":
          "Password must not exceed 20 characters",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter and one number",
      }),

    role_id: Joi.number()
      .valid(1, 2, 3)
      .optional()
      .default(1),

    doctor_id: Joi.number()
      .integer()
      .positive()
      .optional(),

    registration_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        "number.base":
          "Registration ID must be a number",
        "number.integer":
          "Registration ID must be an integer",
        "number.positive":
          "Registration ID must be greater than 0",
      }),

  })
  .custom((value, helpers) => {

    if (
      value.role_id === 2 &&
      !value.registration_id
    ) {
      return helpers.error(
        "any.custom",
        {
          message:
            "Registration ID is required for doctor",
        }
      );
    }

    if (
      value.role_id === 3 &&
      value.registration_id !== undefined
    ) {
      return helpers.error(
        "any.custom",
        {
          message:
            "Registration ID is not allowed for assistant",
        }
      );
    }

    if (
      value.role_id === 1 &&
      value.registration_id !== undefined
    ) {
      return helpers.error(
        "any.custom",
        {
          message:
            "Registration ID is not allowed for normal user",
        }
      );
    }

    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  })
  .options({
    abortEarly: false,
    allowUnknown: false,
  });

  const { error } =
    schema.validate(data);

  if (error) {
    return error.details.map(
      (x) => x.message
    );
  }

  return null;
};

exports.verifyEmailValidation = (query) => {
  const schema = Joi.object({
    token: Joi.string().required(),
  });

  const { error } = schema.validate(query);

  return error ? error.details[0].message : null;
};

exports.getUsersValidation = (query) => {
  const schema = Joi.object({
    doctor_id: Joi.number().optional(),
    role_id: Joi.number().optional(),
    email: Joi.string().optional(),
    name: Joi.string().optional(),
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
  });

  const { error } = schema.validate(query);

  return error ? error.details[0].message : null;
};

exports.getUserByDoctorIdValidation = (params) => {
  const schema = Joi.object({
    doctorId: Joi.number().required(),
  });

  const { error } = schema.validate(params);

  return error ? error.details[0].message : null;
};