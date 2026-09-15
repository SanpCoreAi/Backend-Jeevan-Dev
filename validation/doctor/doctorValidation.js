const Joi = require("joi");

const availabilitySchema = Joi.object({

  day: Joi.string()
    .valid(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    )
    .required()
    .messages({
      "any.required": "Day is required",
      "any.only":
        "Day must be Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday",
    }),

  isAvailable: Joi.boolean()
    .default(true)
    .messages({
      "boolean.base":
        "isAvailable must be true or false",
    }),

  startTime: Joi.when("isAvailable", {
    is: true,
    then: Joi.string()
      .trim()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .required()
      .messages({
        "any.required":
          "Start time is required when availability is true",
        "string.pattern.base":
          "Start time must be in HH:mm format",
      }),

    otherwise: Joi.string()
      .trim()
      .allow("")
      .allow(null)
      .optional(),
  }),

  endTime: Joi.when("isAvailable", {
    is: true,
    then: Joi.string()
      .trim()
      .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
      .required()
      .messages({
        "any.required":
          "End time is required when availability is true",
        "string.pattern.base":
          "End time must be in HH:mm format",
      }),

    otherwise: Joi.string()
      .trim()
      .allow("")
      .allow(null)
      .optional(),
  }),

});


const hospitalDetailSchema = Joi.object({

  hospitalName: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .pattern(/^[A-Za-z0-9 .,&'()/#-]+$/)
    .required()
    .messages({
      "any.required": "Hospital name is required",
      "string.empty": "Hospital name cannot be empty",
      "string.pattern.base":
        "Hospital name contains invalid characters.",
    }),

  flatPlotNo: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[A-Za-z0-9 .,&'()/#-]+$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base":
        "Flat/plot number contains invalid characters.",
    }),

  buildingSociety: Joi.string()
    .trim()
    .max(150)
    .pattern(/^[A-Za-z0-9 .,&'()/#-]+$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base":
        "Building/society contains invalid characters.",
    }),

  streetName: Joi.string()
    .trim()
    .max(150)
    .pattern(/^[A-Za-z0-9 .,&'()/#-]+$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base":
        "Street name contains invalid characters.",
    }),

  areaLocality: Joi.string()
    .trim()
    .max(150)
    .pattern(/^[A-Za-z0-9 .,&'()/#-]+$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base":
        "Area/locality contains invalid characters.",
    }),

  landmark: Joi.string()
    .trim()
    .max(150)
    .pattern(/^[A-Za-z0-9 .,&'()/#-]+$/)
    .allow("")
    .optional()
    .messages({
      "string.pattern.base":
        "Landmark contains invalid characters.",
    }),

  city: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "City can contain only letters and spaces.",
    }),

  district: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "District can contain only letters and spaces.",
    }),

  state: Joi.string()
    .trim()
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "State can contain only letters and spaces.",
    }),

  pinCode: Joi.string()
    .trim()
    .pattern(/^[0-9]{6}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Pin code must be exactly 6 digits",
    }),

});


const updateDoctorSchema = Joi.object({

  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[A-Za-z0-9_]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Username can contain only letters, numbers and underscore.",
    }),

  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .optional(),

  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .optional(),

  specialization: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[A-Za-z ]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Specialization can contain only letters and spaces.",
    }),

  qualification: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .pattern(/^[A-Za-z0-9 .,-]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Qualification contains invalid special characters.",
    }),

  experience: Joi.number()
    .integer()
    .min(0)
    .max(70)
    .optional(),

  language: Joi.array()
    .items(
      Joi.string()
        .trim()
        .min(1)
        .max(50)
        .pattern(/^[A-Za-z ]+$/)
        .messages({
          "string.pattern.base":
            "Language can contain only letters and spaces.",
        })
    )
    .max(20)
    .optional(),

  consultationFee: Joi.number()
    .min(0)
    .max(100000)
    .optional(),

  medicalLicenseNo: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[A-Za-z0-9/-]+$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Medical license number contains invalid special characters.",
    }),

  registration_number: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[A-Za-z0-9/-]+$/)
    .allow(null)
    .optional()
    .messages({
      "string.pattern.base":
        "Registration number contains invalid special characters.",
    }),

  bio: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  availability: Joi.array()
    .items(availabilitySchema)
    .max(7)
    .optional(),

  hospitalDetail: Joi.array()
    .items(hospitalDetailSchema)
    .max(20)
    .optional(),

  acceptEmergencyPatients: Joi.string()
    .trim()
    .uppercase()
    .valid("YES", "NO")
    .optional()
    .messages({
      "any.only":
        "acceptEmergencyPatients must be YES or NO",
    }),

})
  .min(1)
  .options({
    abortEarly: true,
    stripUnknown: true,
    allowUnknown: false,
  })
  .messages({
    "object.min":
      "At least one field is required to update.",

    "object.unknown":
      "Unknown field is not allowed.",
  });

module.exports = {
  updateDoctorSchema
};