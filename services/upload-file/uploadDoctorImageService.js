const multer = require("multer");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const DoctorFileModel = require("../../models/upload-file/doctorProfileImageModel");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadAndReplaceFile = async ({ file, folder, doctorId }) => {
  if (!file) throw new Error("File is required");
  if (!folder) throw new Error("Folder is required");

  const oldFile = await DoctorFileModel.getByDoctorId(doctorId);

  if (oldFile) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: oldFile.file_key,
      })
    );

    await DoctorFileModel.deleteById(oldFile.id);
  }

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

  return { folder: cleanFolder, fileKey, fileUrl };
};

module.exports = {
  upload,
  uploadAndReplaceFile,
};
