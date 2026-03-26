const { upload, uploadAndReplaceFile } = require("../../services/upload-file/uploadDoctorImageService");
const DoctorFileModel = require("../../models/upload-file/doctorProfileImageModel");

const uploadFileAndImage = [
  upload.single("file"),
  async (req, res) => {
    try {
      const doctorId = req.user?.id; 
        console.log(doctorId);
      const folder = req.query.folder;

      if (!doctorId) {
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

      const result = await uploadAndReplaceFile({
        file: req.file,
        folder,
        doctorId,
      });

      await DoctorFileModel.create({
        doctorId,
        fileKey: result.fileKey,
        folderName: result.folder,
      });

      return res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

const getDoctorFiles = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const files = await DoctorFileModel.getAllByDoctorId(doctorId);

    return res.status(200).json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadFileAndImage,
  getDoctorFiles,
};
