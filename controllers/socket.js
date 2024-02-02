// const express = require("express");
// const app = express();
// let http = require("http");
// const server = http.createServer(app);
// const io = require("socket.io")(server);

// socket.on("sendMsg", (data) => {
//     // Handle the "sendMsg" event, you can store the message in the database or broadcast it to other clients
//     logger.info("Received message from client:", data);

//     // Assuming you want to broadcast the message to all connected clients
//     io.emit("sendMsgServer", {
//       type: "otherMsg",
//       msg: data.msg,
//       senderName: data.senderName,
//       userId: data.userId,
//     });
//   });

//   socket.on("disconnect", () => {
//     logger.warn("A user disconnected");
//   });

