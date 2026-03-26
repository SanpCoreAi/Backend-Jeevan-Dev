const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../../config/s3");
const DoctorFileModel = require("../../models/upload-file/doctorFileModel");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFileToS3 = async ({ file, folder }) => {
  if (!file) throw new Error("File is required");
  if (!folder) throw new Error("Folder is required");

  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const ext = file.originalname.split(".").pop();
  const fileKey = `${cleanFolder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return { fileKey, fileUrl, folder: cleanFolder };
};

const getDoctorFiles = async (doctorId) => {
  if (!doctorId) throw new Error("doctorId is required");

  return await DoctorFileModel.findByDoctorId(doctorId);
};

module.exports = {
  upload,
  uploadFileToS3,
  getDoctorFiles,
};
