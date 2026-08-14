const {
  upload,
  uploadDoctorFile,
  getDoctorFiles,
} = require("../../services/upload-file/uploadLicenseService");

const {
  uploadFileQuerySchema,
  validateFile,
  getFilesSchema,
} = require("../../validation/upload/uploadFileValidation");

const uploadFile = (req, res) => {
  upload.single("file")(req, res, async (err) => {
    try {
      // Multer error
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Get doctor ID from JWT
      const doctorId = req.user?.id;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user.",
        });
      }

      // Validate query
      const { error, value } =
        uploadFileQuerySchema.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Validate file
      const fileError = validateFile(req.file);

      if (fileError) {
        return res.status(400).json({
          success: false,
          message: fileError,
        });
      }

      // Only folder comes from query
      const { folder } = value;

      // Upload file
      const result = await uploadDoctorFile({
        doctorId,
        file: req.file,
        folder,
      });

      // Service error
      if (!result.success) {
        return res.status(result.statusCode || 500).json({
          success: false,
          message: result.message,
        });
      }

      // Success response
      return res.status(201).json({
        success: true,
        message: "File uploaded successfully.",
        data: result.data,
      });

    } catch (error) {
      console.error("Upload File Controller Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
      });
    }
  });
};

const getFiles = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const { error, value } = getFilesSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { folder } = value;
    const result = await getDoctorFiles(
      doctorId,
      folder || null
    );

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Files fetched successfully.",
      count: result.data.length,
      data: result.data,
    });

  } catch (error) {
    console.error("Get Files Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};


module.exports = {
  uploadFile,
  getFiles,
};