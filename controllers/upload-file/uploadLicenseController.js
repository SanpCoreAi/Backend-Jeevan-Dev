const {upload,uploadDoctorFile,getDoctorFiles,} = require("../../services/upload-file/uploadLicenseService");

const {uploadFileQuerySchema,validateFile,getFilesSchema,} = require("../../validation/upload/uploadFileValidation");

function uploadFile(req, res) {
  upload.single("file")(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const doctorId = req.user?.id;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { error } = uploadFileQuerySchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { folder } = req.query;

      const fileError = validateFile(req.file);
      if (fileError) {
        return res.status(400).json({
          success: false,
          message: fileError,
        });
      }

      const result = await uploadDoctorFile({
        doctorId,
        file: req.file,
        folder,
      });

      if (!result.success) {
        return res.status(500).json(result);
      }

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: result.data,
      });
    } catch (error) {
      console.error("Controller Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  });
}

async function getFiles(req, res) {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { error } = getFilesSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { folder } = req.query;

    const result = await getDoctorFiles(doctorId, folder);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    console.error("Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

module.exports = {
  uploadFile,
  getFiles,
};