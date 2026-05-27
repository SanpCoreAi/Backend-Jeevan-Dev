const jwt = require("jsonwebtoken");

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Token missing"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "MY_SUPER_SECRET_KEY");
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user_id = socket.user?.id;
    const role_id = socket.user?.role_id;
    console.log(`Socket connected: user=${user_id} role=${role_id} socketId=${socket.id}`);

    if (user_id) {
      socket.join(`user_${user_id}`);
    }

    socket.on("sendEmergency", async ({ message }) => {
      if (!message) return;

      const fromUser = socket.user;
      const targetRole = fromUser.role_id === 2 ? 3 : 2; // Doctor -> Assistant, Assistant -> Doctor
      const targetUsers = await require("../models/emergencyModel").findTargetUser(fromUser.id, fromUser.role_id);

      targetUsers.forEach(target_user_id => {
        io.to(`user_${target_user_id}`).emit("receiveEmergency", {
          from_user: fromUser.id,
          from_role: fromUser.role_id === 2 ? "Doctor" : "Assistant",
          message,
          timestamp: new Date(),
        });
      });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user=${user_id} socket=${socket.id}`);
    });
  });
};
