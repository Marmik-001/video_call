import type WebSocket from "ws";
import type { CustomWebSocket, ServerMessage, ClientMessage } from "../types/websocket.types.js";
import type { ErrorPayload } from "../types/websocket.types.js";

export function sendMessage(ws:CustomWebSocket, message: ServerMessage):void {
  ws.send(JSON.stringify(message))
}

export function sendError(ws: CustomWebSocket, payload:  ErrorPayload): void {
  const res = {
    type: "ERROR" as const,
    payload
  }
  ws.send(JSON.stringify(res))
}

export function broadcastMessage(
  clients: Map<string, CustomWebSocket>,
  exclude_username: string,
  message:ServerMessage
): void {
  
}


export function parseRawWebSocketData(
  data: WebSocket.RawData,
): ClientMessage | null {
  try {
    return JSON.parse(data.toString()) as ClientMessage;
  } catch (err) {
    console.error("error in parsing data", err);
    return null;
  }
}
