const Joi = require("joi");

const createDoctorSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Username is required"
    }),

  specialization: Joi.string()
    .required()
    .messages({
      "string.empty": "Specialization is required"
    }),

  qualification: Joi.string().allow(null, ""),

  experience: Joi.number()
    .integer()
    .min(0)
    .max(60)
    .default(0),

  language: Joi.array()
    .items(Joi.string())
    .default([]),

  consultationFee: Joi.number()
    .min(0)
    .default(0),

  medicalLicenseNo: Joi.string()
    .allow(null, ""),

  bio: Joi.string()
    .max(1000)
    .allow(null, ""),

  availability: Joi.array().items(
    Joi.object({
      day: Joi.string().required(),
      from: Joi.string().required(),
      to: Joi.string().required()
    })
  ).default([]),

  hospitalDetail: Joi.array().items(
    Joi.object({
      hospitalName: Joi.string().required(),
      flatPlotNo: Joi.string().required(),
      buildingSociety: Joi.string().required(),
      streetName: Joi.string().required(),
      areaLocality: Joi.string().required(),
      landmark: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      state: Joi.string().required(),
      pinCode: Joi.string().required()
    })
  ).default([])
});


const updateDoctorSchema = Joi.object({
  username: Joi.string().min(3).max(50),

  specialization: Joi.string(),

  qualification: Joi.string().allow(null, ""),

  experience: Joi.number().integer().min(0).max(60),

  language: Joi.array().items(Joi.string()),

  consultationFee: Joi.number().min(0),

  medicalLicenseNo: Joi.string().allow(null, ""),

  bio: Joi.string().max(1000).allow(null, ""),

  availability: Joi.array().items(
    Joi.object({
      day: Joi.string().required(),
      from: Joi.string().required(),
      to: Joi.string().required()
    })
  ),

  hospitalDetail: Joi.array().items(
    Joi.object({
      hospitalName: Joi.string().required(),
      flatPlotNo: Joi.string().required(),
      buildingSociety: Joi.string().required(),
      streetName: Joi.string().required(),
      areaLocality: Joi.string().required(),
      landmark: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      state: Joi.string().required(),
      pinCode: Joi.string().required()
    })
  )
});

module.exports = {
  createDoctorSchema,
  updateDoctorSchema
};