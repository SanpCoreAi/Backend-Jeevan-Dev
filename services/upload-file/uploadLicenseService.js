const multer = require("multer");
const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const s3 = require("../../config/s3");
const DoctorFileModel = require("../../models/upload-file/doctorFileModel");


const MAX_FILE_SIZE = 5 * 1024 * 1024; 

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Only PDF, JPG and PNG files are allowed.")
      );
    }

    cb(null, true);
  },
});

const uploadDoctorFile = async ({
  userId,
  role,
  file,
  folder,
}) => {

  if (!userId) {
    return {
      success: false,
      statusCode: 401,
      message: "Unauthorized user.",
    };
  }

  if (![2, 3].includes(Number(role))) {
    return {
      success: false,
      statusCode: 403,
      message:
        "Only doctor and assistant can upload files.",
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

  try {

    const cleanFolder = folder.replace(
      /^\/+|\/+$/g,
      ""
    );

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    fileKey =
      `${cleanFolder}/${uuidv4()}${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: "inline",
      })
    );

    const savedFile =
      await DoctorFileModel.create({
        doctorId: userId,
        fileKey,
        folderName: cleanFolder,
      });

    const fileUrl =
      `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return {
      success: true,
      statusCode: 201,
      data: {
        ...savedFile,
        fileUrl,
      },
    };

  } catch (error) {

    console.error(
      "Upload Doctor File Error:",
      error
    );

    if (fileKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket:
              process.env.AWS_BUCKET_NAME,
            Key: fileKey,
          })
        );
      } catch (deleteError) {
        console.error(
          "S3 Rollback Error:",
          deleteError
        );
      }
    }

    return {
      success: false,
      statusCode: 500,
      message: "Failed to upload file.",
    };
  }
};

const getDoctorFiles = async (
  doctorId,
  folder = null
) => {

  if (!doctorId) {
    return {
      success: false,
      statusCode: 401,
      message: "Doctor id is required.",
    };
  }


  try {

    const files =
      await DoctorFileModel.findByDoctorId(
        doctorId,
        folder
      );


    return {
      success: true,
      statusCode: 200,
      data: files,
    };

  } catch (error) {

    console.error(
      "Get Doctor Files Error:",
      error
    );


    return {
      success: false,
      statusCode: 500,
      message: "Failed to fetch files.",
    };
  }
};

module.exports = {
  upload,
  uploadDoctorFile,
  getDoctorFiles,
};