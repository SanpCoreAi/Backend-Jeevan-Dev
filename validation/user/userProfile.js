const Joi = require("joi");

const userProfileSchema = Joi.object({

  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .messages({
      "string.base": "Username must be a string.",
      "string.empty": "Username cannot be empty.",
      "string.min": "Username must be at least 3 characters.",
      "string.max": "Username cannot exceed 50 characters."
    }),

  age: Joi.number()
    .integer()
    .min(1)
    .max(120)
    .messages({
      "number.base": "Age must be a number.",
      "number.min": "Age must be at least 1.",
      "number.max": "Age cannot exceed 120."
    }),

  gender: Joi.string()
    .valid("MALE", "FEMALE", "OTHER")
    .messages({
      "any.only": "Gender must be MALE, FEMALE or OTHER."
    }),

  language: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(30)
    )
    .max(10)
    .messages({
      "array.base": "Language must be an array."
    }),

  address: Joi.object({

    address_line_1: Joi.string()
      .trim()
      .max(150),

    address_line_2: Joi.string()
      .trim()
      .allow("")
      .max(150),

    city: Joi.string()
      .trim()
      .max(50),

    state: Joi.string()
      .trim()
      .max(50),

    country: Joi.string()
      .trim()
      .max(50),

    pincode: Joi.string()
      .trim()
      .pattern(/^[0-9]{6}$/)
      .messages({
        "string.pattern.base": "Pincode must contain exactly 6 digits."
      })

  }),

  blood_group: Joi.string()
    .valid(
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-"
    )
    .messages({
      "any.only": "Invalid blood group."
    }),

  weight: Joi.number()
    .min(1)
    .max(500)
    .messages({
      "number.base": "Weight must be a number."
    }),

  height: Joi.number()
    .min(20)
    .max(300)
    .messages({
      "number.base": "Height must be a number."
    }),

  existing_conditions: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(100)
    )
    .max(30),

  allergies: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(100)
    )
    .max(30),

  bio: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .messages({
      "string.max": "Bio cannot exceed 500 characters."
    }),

  emergency_contact: Joi.object({

    name: Joi.string()
      .trim()
      .max(100),

    relation: Joi.string()
      .trim()
      .max(50),

    phone_number: Joi.string()
      .trim()
      .pattern(/^[6-9]\d{9}$/)
      .messages({
        "string.pattern.base":
          "Invalid emergency contact phone number."
      })

  })

})
.min(1);

exports.validateUserProfile = (data) => {

  const { error } = userProfileSchema.validate(data, {

    abortEarly: true,
    allowUnknown: false,
    stripUnknown: true

  });

  return error
    ? error.details[0].message
    : null;

};