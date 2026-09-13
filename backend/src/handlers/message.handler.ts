import { WebSocket } from "ws";
import { parseRawWebSocketData } from "../utils/ws.utils.js";
import { setUsername } from "./auth.handler.js";
import type { CustomWebSocket } from "../types/websocket.types.js";
import { getAllUsernamesHandler, messageReceivedHandler } from "./chat.handler.js";
import { handleAnswer, handleCallEnded, handleIceCandidate, handleIncomingOffer, handleRejected } from "./offer.handler.js";

export const onMessageHandler = (
  raw: WebSocket.RawData,
  ws: CustomWebSocket,
) => {
  const data = parseRawWebSocketData(raw);
  if (!data) return;
  console.log("messege received from the client", data);
  console.log("res type: ", data.type);

  switch (data.type) {
    case "SET_USERNAME": {
      setUsername(data.payload, ws);
      break;
    }

    case "MESSAGE_RECEIVED": {
      messageReceivedHandler(data.payload, ws);
      break;
    }
    case "GET_ALL_USERNAMES": {
      getAllUsernamesHandler(ws);
      break;
    }
    case "OFFER": {
      handleIncomingOffer(ws, data.payload)
      break;
    }
    case "NEW_ICE_CANDIDATE": {
      handleIceCandidate(ws, data.payload)
      break;
    }
    case "ANSWER": {
      handleAnswer(ws, data.payload)
      break;
    }
    case "REJECTED": {
      handleRejected(ws, data.payload)
      break;
    }
    case "CALL_ENDED": {
      handleCallEnded(ws, data.payload)
      break;
    }
  }
};
