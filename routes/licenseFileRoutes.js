const express = require("express");
const router = express.Router();

const { uploadFile, getFiles, deleteFile} = require("../controllers/upload-file/uploadLicenseController");
const { uploadFileAndImage, getFileImage } = require("../controllers/upload-file/doctorProfileImageController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {allowRoles}=require("../middlewares/role");

router.post("/upload", verifyToken, allowRoles(1,2,3), uploadFile);
router.get("/files", verifyToken, getFiles);
router.delete(
  "/deleteFiles/:id",
  verifyToken,
  deleteFile
);

router.post(
  "/imageUpload",
  verifyToken,
  allowRoles(1, 2, 3),
  uploadFileAndImage
);

router.get(
  "/getFiles",
  verifyToken,
 getFileImage
);

module.exports = router;