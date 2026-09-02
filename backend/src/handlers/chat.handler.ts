import { ConnectionManagerInstance } from "../service/connectionManager.js";
import type {
  CustomWebSocket,
  ErrorPayload,
  MessageReceivedPayload,
  ServerMessage,
} from "../types/websocket.types.js";
import { sendError, sendMessage } from "../utils/ws.utils.js";

export const messageReceivedHandler = (
  payload: MessageReceivedPayload,
  ws: CustomWebSocket,
) => {
  const { target_username, message } = payload;
  const targetWS = ConnectionManagerInstance.get(target_username);
  if (targetWS && targetWS.readyState === WebSocket.OPEN) {
    if (ws.username) {
      const sendData: ServerMessage = {
        type: "MESSAGE_FROM_USER",
        payload: {
          message: message,
          from_username: ws.username,
        },
      };
      sendMessage(targetWS, sendData);
    } 
  }
};

export const getAllUsernamesHandler = (ws: CustomWebSocket) => {

  if (!ws.username) {
    const authErr: ErrorPayload = {
      code: "UNAUTHENTICATED",
      message: "username not found", 
    }
    sendError(ws, authErr)
    return
  }

  const clientsArr = ConnectionManagerInstance.getAllUsernames();
  if (ws && ws.readyState === WebSocket.OPEN) {
    const sendData: ServerMessage = {
      type: "ALL_ACTIVE_CLIENTS",
      payload: {
        clients: clientsArr,
      },
    };
    sendMessage(ws, sendData);
  }
};
