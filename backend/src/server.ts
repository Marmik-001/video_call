import { app } from "./app.js";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { configDotenv } from "dotenv"
import { onMessageHandler } from "./handlers/message.handler.js";
import { onCloseHandler } from "./handlers/auth.handler.js";

configDotenv();

const PORT = Number(process.env.PORT) || 8080;
const server = createServer(app);
const wss = new WebSocketServer({ server });


wss.on("connection", (ws) => {
  console.log(`[WSS] Client connected. Total active connections: ${wss.clients.size}`);
  ws.on("message", (e) => onMessageHandler(e , ws ));
  ws.on("close", function () {
    console.log(`[WSS] Client disconnected. Total active connections: ${wss.clients.size}`);
    onCloseHandler(ws)
  });
});

server.listen(PORT, () => {
  console.log("server up on port: ", PORT);
});
