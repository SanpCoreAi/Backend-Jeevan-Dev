const express = require("express");
const router = express.Router();

const { uploadFile, getFiles} = require("../controllers/upload-file/uploadLicenseController");
const {uploadFileAndImage,getDoctorFiles,} = require("../controllers/upload-file/doctorProfileImageController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/upload", verifyToken, uploadFile);
router.get("/files", verifyToken, getFiles);

router.post("/imageUpload", verifyToken, uploadFileAndImage);
router.get("/getFiles", verifyToken, getDoctorFiles);

module.exports = router;