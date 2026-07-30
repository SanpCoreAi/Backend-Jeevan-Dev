const express = require("express");

const router = express.Router();

const {
    generateQrCodes, getAllQrCodes, getDoctorQrCodes, getAllQrDetails
} = require("../../controllers/admin/generateQrCodesController");

const { connectDoctorQr} = require("../../controllers/admin/connectQrController");
const {allowRoles}=require("../../middlewares/role");
const { verifyToken } = require("../../middlewares/authMiddleware");
const {validate} = require("../../middlewares/validate");

const {
    connectDoctorQrValidation
} = require("../../validation/admin/qrValidation");

router.post(
    "/generate",
    verifyToken,
    generateQrCodes
);

router.put(
  "/doctors/:doctorId/connect-qr",
  verifyToken,
  validate(connectDoctorQrValidation),
  connectDoctorQr
);

router.get(
    "/getAllQR",
    verifyToken,
    getAllQrCodes
);

router.get(
    "/details",
    verifyToken,
    getAllQrDetails
);

router.get(
    "/doctors/:doctorId/qrcodes",
    verifyToken,
    getDoctorQrCodes
);

module.exports = router;