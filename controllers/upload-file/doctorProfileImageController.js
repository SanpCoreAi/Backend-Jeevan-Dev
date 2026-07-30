const {
  upload,
  uploadAndReplaceFile,
  getUserFiles,
} = require("../../services/upload-file/uploadDoctorImageService");

const {
  uploadImageQuerySchema,
  validateImageFile,
} = require("../../validation/upload/uploadDoctorImageValidation");


const uploadFileAndImage = (req, res) => {
  upload.single("file")(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user.",
        });
      }

      const { error } = uploadImageQuerySchema.validate(req.query);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const fileError = validateImageFile(req.file);

      if (fileError) {
        return res.status(400).json({
          success: false,
          message: fileError,
        });
      }

      const { folder } = req.query;

      const result = await uploadAndReplaceFile({
        userId,
        file: req.file,
        folder,
      });

      if (!result.success) {
        return res.status(result.statusCode || 500).json({
          success: false,
          message: result.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        data: result.data,
      });
    } catch (error) {
      console.error("Upload Profile Image Controller Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
      });
    }
  });
};

const getFileImage = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const result = await getUserFiles(userId);

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
    console.error("Get User Files Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  uploadFileAndImage,
  getFileImage
};