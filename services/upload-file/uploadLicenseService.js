const multer = require("multer");

const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const crypto = require("crypto");
const path = require("path");

const s3 = require("../../config/s3");
const DoctorFileModel = require("../../models/upload-file/doctorFileModel");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Only PDF, JPG and PNG files are allowed.")
      );
    }

    cb(null, true);
  }
});

const uploadDoctorFile = async ({
  userId,
  role,
  file,
  folder
}) => {
  if (!userId) {
    return {
      success: false,
      statusCode: 401,
      message: "Unauthorized user."
    };
  }

  if (![1, 2, 3].includes(Number(role))) {
    return {
      success: false,
      statusCode: 403,
      message: "User, doctor and assistant can upload files."
    };
  }

  if (!file) {
    return {
      success: false,
      statusCode: 400,
      message: "File is required."
    };
  }

  if (!folder) {
    return {
      success: false,
      statusCode: 400,
      message: "Folder is required."
    };
  }

  let fileKey = null;

  try {
    const cleanFolder = folder
      .trim()
      .replace(/^\/+|\/+$/g, "");

    const originalName = path.parse(file.originalname).name;

    const cleanFileName = originalName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const shortId = crypto
      .randomBytes(3)
      .toString("hex");

    const fileName =
      `${cleanFileName || "file"}-${shortId}${extension}`;

    fileKey = `${cleanFolder}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: "inline",
        Metadata: {
          originalname: encodeURIComponent(file.originalname)
        }
      })
    );

    await DoctorFileModel.create({
      doctorId: userId,
      fileKey,
      folderName: cleanFolder
    });

    return {
      success: true,
      statusCode: 201,
      data: {
        userId,
        key: fileKey,
        folderName: cleanFolder
      }
    };
  } catch (error) {
    console.error("Upload Doctor File Error:", error);

    if (fileKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey
          })
        );
      } catch (deleteError) {
        console.error("S3 Rollback Error:", deleteError);
      }
    }

    return {
      success: false,
      statusCode: 500,
      message: "Failed to upload file."
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
      message: "Doctor id is required."
    };
  }

  try {
    const files = await DoctorFileModel.findByDoctorId(
      doctorId,
      folder
    );

    const filesWithSignedUrls = await Promise.all(
      files.map(async (file) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: file.fileKey
        });

        const signedUrl = await getSignedUrl(
          s3,
          command,
          {
            expiresIn: 3600
          }
        );

        const fileInfo = await s3.send(
          new HeadObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.fileKey
          })
        );

        const fileSize = fileInfo.ContentLength;

        const originalName = decodeURIComponent(
          fileInfo.Metadata?.originalname || ""
        );

        const baseUrl =
          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

        const relativeSignedUrl =
          signedUrl.replace(baseUrl, "");

        return {
          id: file.id,
          folderName: file.folderName,
          originalName,
          fileSize: `${(
            fileSize /
            (1024 * 1024)
          ).toFixed(2)} MB`,
          createdAt: file.createdAt,
          fileUrl: relativeSignedUrl
        };
      })
    );

    return {
      success: true,
      statusCode: 200,
      data: filesWithSignedUrls
    };
  } catch (error) {
    console.error(
      "Get Doctor Files Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Failed to fetch files."
    };
  }
};

const deleteDoctorFile = async ({
  userId,
  role,
  fileId
}) => {
  if (!userId) {
    return {
      success: false,
      statusCode: 401,
      message: "Unauthorized user."
    };
  }

  if (![1, 2, 3].includes(Number(role))) {
    return {
      success: false,
      statusCode: 403,
      message:
        "User, doctor and assistant can delete files."
    };
  }

  if (!fileId) {
    return {
      success: false,
      statusCode: 400,
      message: "File id is required."
    };
  }

  try {
    const file =
      await DoctorFileModel.findById(fileId);

    if (!file) {
      return {
        success: false,
        statusCode: 404,
        message:
          "File not found or already deleted."
      };
    }

    if (
      Number(file.doctorId) !==
      Number(userId)
    ) {
      return {
        success: false,
        statusCode: 403,
        message:
          "You are not authorized to delete this file."
      };
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.fileKey
      })
    );

    const updated =
      await DoctorFileModel.softDelete(fileId);

    if (!updated) {
      return {
        success: false,
        statusCode: 500,
        message:
          "Failed to update file status."
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "File deleted successfully."
    };
  } catch (error) {
    console.error(
      "Delete Doctor File Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete file."
    };
  }
};

module.exports = {
  upload,
  uploadDoctorFile,
  getDoctorFiles,
  deleteDoctorFile
};