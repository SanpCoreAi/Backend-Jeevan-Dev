const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const doctorRoutes = require("./routes/doctorRoutes");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const licenseFileRoutes = require("./routes/licenseFileRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const likeRoutes = require("./routes/likeRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const socketHandler = require("./socket/socketHandler");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const assistantProfileRoutes = require("./routes/assistant/assistantProfileRoutes");
const notificationRoutes = require("./routes/notification/notificationRoutes")
const AppointmentGraph = require("./routes/Dashboard")
const appointmentCron = require("./cron/appointmentCron");
const qrCodeRouter = require("./routes/admin/qrCodeRouter")
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

socketHandler(io);

app.set("io", io);
app.use("/api/doctors", doctorRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userProfileRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/licenseFile", licenseFileRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use( "/api/assistant", assistantProfileRoutes);
app.use('/api/dashboard', AppointmentGraph);
app.use('/api/notification', notificationRoutes);
app.use("/api/QR", qrCodeRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});