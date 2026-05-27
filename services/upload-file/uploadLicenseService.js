const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../../config/s3");
const DoctorFileModel = require("../../models/upload-file/doctorFileModel");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

// Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, PNG allowed"));
    }
    cb(null, true);
  },
});

// Upload + DB Save (FULL FLOW)
async function uploadDoctorFile({ doctorId, file, folder }) {
  if (!doctorId || !file || !folder) {
    return {
      success: false,
      message: "doctorId, file and folder are required",
    };
  }

  try {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    const ext = file.originalname.split(".").pop();
    const fileKey = `${cleanFolder}/${uuidv4()}.${ext}`;

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: "inline",
      })
    );

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Save to DB
    const savedFile = await DoctorFileModel.create({
      doctorId,
      fileKey,
      folderName: folder,
    });

    return {
      success: true,
      data: {
        ...savedFile,
        fileUrl,
      },
    };
  } catch (error) {
    console.error("Service Error:", error);

    return {
      success: false,
      message: "File upload failed",
    };
  }
}

// Get Files
async function getDoctorFiles(doctorId, folder = null) {
  if (!doctorId) {
    return {
      success: false,
      message: "doctorId is required",
    };
  }

  try {
    const files = await DoctorFileModel.findByDoctorId(
      doctorId,
      folder
    );

    return {
      success: true,
      data: files,
    };
  } catch (error) {
    console.error("Service Fetch Error:", error);

    return {
      success: false,
      message: "Failed to fetch files",
    };
  }
}

module.exports = {
  upload,
  uploadDoctorFile,
  getDoctorFiles,
};