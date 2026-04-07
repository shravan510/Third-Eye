const { Server } = require("socket.io");

module.exports = function (server) {
    const io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`[SOCKET] Client connected: ${socket.id}`);

        socket.on("disconnect", () => {
            console.log(`[SOCKET] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};
