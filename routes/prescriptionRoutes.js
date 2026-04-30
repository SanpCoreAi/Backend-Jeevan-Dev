const router = require("express").Router();
const ctrl = require("../controllers/doctor/prescriptionController");

const {verifyToken} = require("../middlewares/authMiddleware")

router.post("/", verifyToken, ctrl.save);

module.exports = router;