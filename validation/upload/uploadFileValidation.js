const Joi = require("joi");

const uploadFileQuerySchema = Joi.object({
  folder: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Folder is required",
    "any.required": "Folder is required",
  }),
});

function validateFile(file) {
  if (!file) return "File is required";

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return "Only PDF, JPG, PNG files are allowed";
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return "File size must be less than 5MB";
  }

  return null;
}

const getFilesSchema = Joi.object({
  folder: Joi.string().optional(),
});

module.exports = {
  uploadFileQuerySchema,
  validateFile,
  getFilesSchema,
};