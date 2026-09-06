const jwt = require("jsonwebtoken");

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Token missing"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "MY_SUPER_SECRET_KEY"
      );

      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user_id = socket.user?.id;
    const role_id = socket.user?.role_id;

    if (user_id) {
      socket.join(`user_${user_id}`);
    }

    // Role ID 2 emergency bhej sakta hai
    socket.on("sendEmergency", ({ message }) => {
      if (!message) return;

      const fromUser = socket.user;

      // Sirf Role ID 2 send kar sakta hai
      if (Number(fromUser.role_id) !== 2) {
        socket.emit("emergencyError", {
          message: "Only Role ID 2 can send emergency alerts",
        });

        return;
      }

      // Role ID 1 ke connected users ko alert bhejo
      for (const [, clientSocket] of io.of("/").sockets) {
        if (Number(clientSocket.user?.role_id) === 1) {
          clientSocket.emit("receiveEmergency", {
            from_user: fromUser.id,
            from_role: fromUser.role_id,
            message,
            timestamp: new Date(),
          });
        }
      }
    });

    socket.on("disconnect", () => {
      // User disconnected
    });
  });
};