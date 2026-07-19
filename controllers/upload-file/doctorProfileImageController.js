const {
  upload,
  uploadAndReplaceFile,
} = require("../../services/upload-file/uploadDoctorImageService");

const UserImageModel = require("../../models/upload-file/doctorProfileImageModel");

const uploadFileAndImage = [
  upload.single("file"),

  async (req, res) => {
    try {
      const userId = req.user?.id;
      const folder = req.query.folder;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!folder) {
        return res.status(400).json({
          success: false,
          message: "Folder name is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      const result = await uploadAndReplaceFile({
        file: req.file,
        folder,
        userId,
      });

      await UserImageModel.create({
        userId,
        fileKey: result.fileKey,
        folderName: result.folder,
      });

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: result,
      });
    } catch (error) {
      console.error("Upload Image Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

const getUserFiles = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const files = await UserImageModel.getAllByUserId(userId);

    return res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error("Get User Files Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadFileAndImage,
  getUserFiles,
};