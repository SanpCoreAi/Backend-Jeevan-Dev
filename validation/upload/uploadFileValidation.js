const Joi = require("joi");

const ALLOWED_FOLDERS = [
  "doctor-licenses",
  "doctor-profile",
  "user-profile",
  "documents",
  "assistant-profile",
  "assistant-documents",
];

const uploadFileQuerySchema = Joi.object({
  folder: Joi.string()
    .trim()
    .lowercase()
    .pattern(
      /^(doctor-licenses|doctor-profile|user-profile|documents|user-documents|assistant-profile|assistant-documents)(\/[a-z0-9-]+)?$/
    )
    .required()
    .messages({
      "string.empty": "Folder is required.",

      "any.required": "Folder is required.",

      "string.pattern.base":
        "Folder must be in format: main-folder/sub-folder. Example: assistant-profile/subhas",
    }),
});

const validateFile = (file) => {
  if (!file) {
    return "File is required.";
  }

  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return "Only PDF, JPG and PNG files are allowed.";
  }

  const maxFileSize = 5 * 1024 * 1024; // 5 MB

  if (file.size > maxFileSize) {
    return "File size must not exceed 5 MB.";
  }

  return null;
};

const getFilesSchema = Joi.object({
  folder: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .valid(...ALLOWED_FOLDERS)
    .optional()
    .messages({
      "string.pattern.base":
        "Folder can contain only lowercase letters, numbers and hyphens.",

      "any.only":
        `Folder must be one of: ${ALLOWED_FOLDERS.join(", ")}`,
    }),
});


module.exports = {
  uploadFileQuerySchema,
  validateFile,
  getFilesSchema,
  ALLOWED_FOLDERS,
};