const Joi = require("joi");

exports.registerValidation = (data) => {

  const schema = Joi.object({

    full_name: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required(),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .required(),

    phone_number: Joi.string()
      .trim()
      .pattern(/^[6-9]\d{9}$/)
      .required(),

    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/)
      .optional(),

    role_id: Joi.number()
      .valid(1, 2, 3)
      .optional(),

    doctor_id: Joi.number().integer().positive().optional(),

    registration_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        "any.required": "Registration ID is required",
        "number.base": "Registration ID must be a number",
        "number.integer": "Registration ID must be an integer",
        "number.positive": "Registration ID must be greater than 0",
      }),

  }).options({
    abortEarly: false,
    allowUnknown: false
  });

  const { error } = schema.validate(data);

  if (error) {
    return error.details.map(x => x.message);
  }

  return null;

}

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