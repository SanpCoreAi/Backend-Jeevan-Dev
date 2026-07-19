const express = require("express");
const router = express.Router();

const { uploadFile, getFiles} = require("../controllers/upload-file/uploadLicenseController");
const { uploadFileAndImage, getUserFiles } = require("../controllers/upload-file/doctorProfileImageController");
const { verifyToken } = require("../middlewares/authMiddleware");
const {allowRoles}=require("../middlewares/role");

router.post("/upload", verifyToken, uploadFile);
router.get("/files", verifyToken, getFiles);

router.post("/imageUpload", verifyToken, allowRoles(1,2,3), ...uploadFileAndImage);

router.get("/getFiles", verifyToken, getUserFiles);

module.exports = router;