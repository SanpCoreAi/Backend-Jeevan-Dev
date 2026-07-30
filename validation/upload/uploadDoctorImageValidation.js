const Joi = require("joi");

const ALLOWED_FOLDERS = [
  "doctor-profile",
  "user-profile",
  "assistant-profile",
];

const uploadImageQuerySchema = Joi.object({
  folder: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .valid(...ALLOWED_FOLDERS)
    .required()
    .messages({
      "string.empty": "Folder is required.",
      "any.required": "Folder is required.",
      "string.pattern.base":
        "Folder can contain only lowercase letters, numbers and hyphens.",
      "any.only": `Folder must be one of: ${ALLOWED_FOLDERS.join(", ")}`,
    }),
});

const validateImageFile = (file) => {
  if (!file) {
    return "Image file is required.";
  }

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return "Only JPG, JPEG and PNG images are allowed.";
  }

  const maxFileSize = 5 * 1024 * 1024; // 5 MB

  if (file.size > maxFileSize) {
    return "Image size must not exceed 5 MB.";
  }

  return null;
};

const getUserFilesSchema = Joi.object({
  folder: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .valid(...ALLOWED_FOLDERS)
    .optional()
    .messages({
      "string.pattern.base":
        "Folder can contain only lowercase letters, numbers and hyphens.",
      "any.only": `Folder must be one of: ${ALLOWED_FOLDERS.join(", ")}`,
    }),
});

module.exports = {
  uploadImageQuerySchema,
  validateImageFile,
  getUserFilesSchema,
  ALLOWED_FOLDERS,
};