const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor/createdoctorController");
const { getDoctors } = require("../controllers/doctor/getdoctorController");
// const { doctorSearch } = require("../controllers/doctor/serachDoctorController");
const DoctorSearchController = require("../controllers/doctor/serachDoctorController");
const { verifyToken } = require("../middlewares/authMiddleware");
const DoctorRatingController = require("../controllers/doctor/doctorRatingController");
const {allowRoles}=require("../middlewares/role");



router.post("/create-profile", verifyToken,allowRoles(2), doctorController.createDoctorProfile);
router.put("/update-profile", verifyToken,allowRoles(2), doctorController.updateDoctorProfile);
router.get("/getDoctorProfileById", verifyToken, doctorController.getDoctorProfile);
router.get("/getDoctorPublicProfileById/:userId", verifyToken, doctorController.getDoctorPublicProfileById);

router.put("/getAlldoctor", verifyToken, doctorController.getAllDoctors);

router.get("/getDoctors", verifyToken, allowRoles(2,3), getDoctors);

router.get("/doctor/search", DoctorSearchController.searchDoctors);

router.get("/public/:doctorId", doctorController.getDoctorPublicProfileById);


router.get("/:doctorId", DoctorRatingController.getDoctorProfileWithRating);


module.exports = router;
