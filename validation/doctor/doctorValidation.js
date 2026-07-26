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
    .required(),

  isAvailable: Joi.boolean()
    .default(true),

  startTime: Joi.when("isAvailable", {
    is: true,
    then: Joi.string().trim().required(),
    otherwise: Joi.allow(null, "")
  }),

  endTime: Joi.when("isAvailable", {
    is: true,
    then: Joi.string().trim().required(),
    otherwise: Joi.allow(null, "")
  })

});

const updateDoctorSchema = Joi.object({

  username: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .optional(),

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
    .optional(),

  qualification: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  experience: Joi.number()
    .integer()
    .min(0)
    .max(70)
    .optional(),

  language: Joi.array()
    .items(
      Joi.string()
        .trim()
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
    .optional(),

  bio: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  availability: Joi.array()
    .items(availabilitySchema)
    .optional(),

  hospitalDetail: Joi.array()
    .items(

      Joi.object({

        hospitalName: Joi.string()
          .trim()
          .required(),

        flatPlotNo: Joi.string()
          .trim()
          .allow("")
          .optional(),

        buildingSociety: Joi.string()
          .trim()
          .allow("")
          .optional(),

        streetName: Joi.string()
          .trim()
          .allow("")
          .optional(),

        areaLocality: Joi.string()
          .trim()
          .allow("")
          .optional(),

        landmark: Joi.string()
          .trim()
          .allow("")
          .optional(),

        city: Joi.string()
          .trim()
          .max(100)
          .optional(),

        district: Joi.string()
          .trim()
          .max(100)
          .optional(),

        state: Joi.string()
          .trim()
          .max(100)
          .optional(),

        pinCode: Joi.string()
          .trim()
          .pattern(/^[0-9]{6}$/)
          .optional()

      })

    )
    .optional()

})
  .min(1)
  .options({
    abortEarly: true,
    stripUnknown: true,
    allowUnknown: false
  })
  .messages({
    "object.min": "At least one field is required to update."
  });

module.exports = {
  updateDoctorSchema
};