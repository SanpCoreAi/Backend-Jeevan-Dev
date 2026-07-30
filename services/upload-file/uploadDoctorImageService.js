const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {PutObjectCommand, DeleteObjectCommand,} = require("@aws-sdk/client-s3");

const s3 = require("../../config/s3");
const UserImageModel = require("../../models/upload-file/doctorProfileImageModel");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, JPEG and PNG files are allowed.")
      );
    }

    cb(null, true);
  },
});


const uploadAndReplaceFile = async ({
  userId,
  file,
  folder,
}) => {
  if (!userId) {
    return {
      success: false,
      statusCode: 401,
      message: "User id is required.",
    };
  }

  if (!file) {
    return {
      success: false,
      statusCode: 400,
      message: "File is required.",
    };
  }

  if (!folder) {
    return {
      success: false,
      statusCode: 400,
      message: "Folder is required.",
    };
  }

  let fileKey = null;
  let oldFile = null;

  try {
    oldFile = await UserImageModel.getByUserId(userId);

    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");

    const extension = path.extname(file.originalname);

    fileKey = `${cleanFolder}/${uuidv4()}${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: "inline",
      })
    );

    if (oldFile) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldFile.file_key,
          })
        );

        await UserImageModel.deleteById(oldFile.id);
      } catch (err) {
        console.error("Old image delete error:", err);
      }
    }

    const savedImage = await UserImageModel.create({
      userId,
      fileKey,
      folderName: cleanFolder,
    });

    return {
      success: true,
      statusCode: 201,
      data: {
        ...savedImage,
        fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
      },
    };
  } catch (error) {
    console.error("Upload Profile Image Error:", error);

    if (fileKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
          })
        );
      } catch (rollbackError) {
        console.error("Rollback Error:", rollbackError);
      }
    }

    return {
      success: false,
      statusCode: 500,
      message: "Failed to upload profile image.",
    };
  }
};

const getUserFiles = async (userId) => {
  if (!userId) {
    return {
      success: false,
      statusCode: 401,
      message: "User id is required.",
    };
  }

  try {
    const files = await UserImageModel.getAllByUserId(userId);

    return {
      success: true,
      statusCode: 200,
      data: files,
    };
  } catch (error) {
    console.error("Get User Files Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to fetch files.",
    };
  }
};

module.exports = {
  upload,
  uploadAndReplaceFile,
  getUserFiles,
};