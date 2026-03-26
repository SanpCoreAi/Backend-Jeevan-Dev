const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor/createdoctorController");
const { getDoctors } = require("../controllers/doctor/getdoctorController");
// const { doctorSearch } = require("../controllers/doctor/serachDoctorController");
const DoctorSearchController = require("../controllers/doctor/serachDoctorController");
const { verifyToken } = require("../middlewares/authMiddleware");
const DoctorRatingController = require("../controllers/doctor/doctorRatingController");
router.post("/create-profile", verifyToken, doctorController.createDoctorProfile);
router.put("/update-profile", verifyToken, doctorController.updateDoctorProfile);
router.get("/getDoctorProfileById", verifyToken, doctorController.getDoctorProfile);
router.get("/getDoctorPublicProfileById/:doctorId", verifyToken, doctorController.getDoctorPublicProfileById);
router.get("/getDoctors", verifyToken, getDoctors);

// routes/doctorRoutes.js
router.get("/doctor/search", DoctorSearchController.searchDoctors);

router.get("/public/:doctorId", doctorController.getDoctorPublicProfileById);


router.get("/:doctorId", DoctorRatingController.getDoctorProfileWithRating);

// const { getAllDoctors, } = require("../controllers/doctor/createdoctorController");

// router.get("/getAllDoctors", getAllDoctors);

// router.get("/getDoctorByProfile", verifyToken, getDoctorById);

module.exports = router;
