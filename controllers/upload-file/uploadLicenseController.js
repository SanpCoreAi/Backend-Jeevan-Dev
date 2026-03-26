const {upload, uploadFileToS3, getDoctorFiles} = require("../../services/upload-file/uploadLicenseService");

const DoctorFileModel = require("../../models/upload-file/doctorFileModel");

const doctorFileController = {
uploadFile: (req, res) => {
    upload.single("file")(req, res, async (err) => {
      try {
        
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        // const doctorId = req.query.doctorId;
        const folder = req.query.folder;

        const doctorId = req.user?.id; // from JWT
        console.log(doctorId);

        if (!doctorId || !folder) {
          return res.status(400).json({
            success: false,
            message: "doctorId and folder are required",
          });
        }

        const { fileKey, fileUrl } = await uploadFileToS3({
          file: req.file,
          folder,
        });

        await DoctorFileModel.create({
          doctorId,
          fileKey,
          folderName: folder,
          fileUrl,
        });

        return res.status(201).json({
          success: true,
          message: "File uploaded successfully",
          data: { folder, fileKey, fileUrl },
        });

      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });
  },

  getFiles: async (req, res) => {
    try {
      const doctorId = req.query.doctorId;

      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: "doctorId is required",
        });
      }

      const files = await getDoctorFiles(doctorId);

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
  },
};

module.exports = doctorFileController;
