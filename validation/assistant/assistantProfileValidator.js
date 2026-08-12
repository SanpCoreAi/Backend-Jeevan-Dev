const Joi = require("joi");

const genderSchema = Joi.string()
  .trim()
  .valid("Male", "Female", "Other");

const ageSchema = Joi.number()
  .integer()
  .min(18)
  .max(80);

const departmentSchema = Joi.string()
  .trim()
  .min(2)
  .max(100);

const educationSchema = Joi.string()
  .trim()
  .min(2)
  .max(200);

const experienceSchema = Joi.number()
  .integer()
  .min(0)
  .max(60);

const languageSchema = Joi.alternatives().try(
  Joi.array().items(
    Joi.string().trim().min(1).max(50)
  ),
  Joi.string().trim().min(1).max(50)
);

const addressSchema = Joi.object({
  flat: Joi.string().trim().max(100).allow("").optional(),
  building: Joi.string().trim().max(255).allow("").optional(),
  street: Joi.string().trim().max(255).allow("").optional(),
  area: Joi.string().trim().max(255).allow("").optional(),
  landmark: Joi.string().trim().max(255).allow("").optional(),
  city: Joi.string().trim().max(100).allow("").optional(),
  district: Joi.string().trim().max(100).allow("").optional(),
  state: Joi.string().trim().max(100).allow("").optional(),
  pincode: Joi.string().trim().max(20).allow("").optional()
}).unknown(false);

const bioSchema = Joi.string()
  .trim()
  .max(500)
  .allow("");

exports.createAssistantProfileValidation = (data) => {

  const schema = Joi.object({

    gender: genderSchema.required(),

    age: ageSchema.optional(),

    department: departmentSchema.required(),

    education: educationSchema.required(),

    experience: experienceSchema.optional(),

    language: languageSchema.optional(),

    address: addressSchema.optional(),

    bio: bioSchema.optional()

  })
    .required()
    .unknown(false);

  const { error } = schema.validate(data, {
    abortEarly: true,
    stripUnknown: true
  });

  return error
    ? error.details[0].message
    : null;
};

exports.updateAssistantProfileValidation = (data) => {

  const schema = Joi.object({

    gender: genderSchema.optional(),

    age: ageSchema.optional(),

    department: departmentSchema.optional(),

    education: educationSchema.optional(),

    experience: experienceSchema.optional(),

    language: languageSchema.optional(),

    address: addressSchema.optional(),

    bio: bioSchema.optional()

  })
    .min(1)
    .unknown(false);

  const { error } = schema.validate(data, {
    abortEarly: true,
    stripUnknown: true
  });

  return error
    ? error.details[0].message
    : null;
};