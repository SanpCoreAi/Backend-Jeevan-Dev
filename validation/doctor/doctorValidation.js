const Joi = require("joi");

/* ================= AVAILABILITY ================= */
const availabilitySchema = Joi.object({
  day: Joi.string()
    .valid("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday")
    .required(),

  startTime: Joi.when("isAvailable", {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.allow(null, "")
  }),

  endTime: Joi.when("isAvailable", {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.allow(null, "")
  })
});


/* ================= CREATE ================= */
const createDoctorSchema = Joi.object({
  username: Joi.string().required(),

  specialization: Joi.string().required(),

  qualification: Joi.string().required(),

  experience: Joi.number().min(0).required(),

  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .required(),

  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .required(),

  language: Joi.array()
    .items(Joi.string())
    .required(),

  consultationFee: Joi.number()
    .min(0)
    .required(),

  medicalLicenseNo: Joi.string().required(),

  bio: Joi.string().allow("").optional(),

  availability: Joi.array()
    .items(availabilitySchema)
    .required(),

  hospitalDetail: Joi.array()
    .items(
      Joi.object({
        hospitalName: Joi.string().required(),
        flatPlotNo: Joi.string().allow(""),
        buildingSociety: Joi.string().allow(""),
        streetName: Joi.string().allow(""),
        areaLocality: Joi.string().allow(""),
        landmark: Joi.string().allow(""),
        city: Joi.string().required(),
        district: Joi.string().required(),
        state: Joi.string().required(),
        pinCode: Joi.string().required()
      })
    )
    .required()
});


/* ================= UPDATE ================= */
const updateDoctorSchema = Joi.object({
  username: Joi.string().optional(),

  age: Joi.number()
    .integer()
    .min(18)
    .max(100)
    .optional(),

  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .optional(),

  specialization: Joi.string().optional(),

  qualification: Joi.string().optional(),

  experience: Joi.number()
    .min(0)
    .optional(),

  language: Joi.array()
    .items(Joi.string())
    .optional(),

  consultationFee: Joi.number()
    .min(0)
    .optional(),

  medicalLicenseNo: Joi.string().optional(),

  bio: Joi.string()
    .allow("")
    .optional(),

  availability: Joi.array()
    .items(availabilitySchema)
    .optional(),

  hospitalDetail: Joi.array().items(
    Joi.object({
      hospitalName: Joi.string().optional(),
      flatPlotNo: Joi.string().allow("").optional(),
      buildingSociety: Joi.string().allow("").optional(),
      streetName: Joi.string().allow("").optional(),
      areaLocality: Joi.string().allow("").optional(),
      landmark: Joi.string().allow("").optional(),
      city: Joi.string().optional(),
      district: Joi.string().optional(),
      state: Joi.string().optional(),
      pinCode: Joi.string().optional()
    })
  ).optional()
});


/* ================= EXPORT ================= */
module.exports = {
  createDoctorSchema,
  updateDoctorSchema
};