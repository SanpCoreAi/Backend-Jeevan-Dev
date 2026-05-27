const Joi = require("joi");

exports.registerValidation = (data) => {
  const schema = Joi.object({
    full_name: Joi.string().min(3).max(50).required(),

    email: Joi.string()
      .email()
      .required(),

    phone_number: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),

    password: Joi.string()
      .min(6)
      .optional(),

    role_id: Joi.number()
      .optional(),

    doctor_id: Joi.number()
      .optional(),
  });

  const { error } = schema.validate(data);

  return error ? error.details[0].message : null;
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