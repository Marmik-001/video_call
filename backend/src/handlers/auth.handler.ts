import { ConnectionManagerInstance, ConnectionManagerInstance as connections} from "../service/connectionManager.js";
import type { CustomWebSocket, ClientMessage, SetUsernamePayload } from "../types/websocket.types.js";

export const setUsername = (payload: SetUsernamePayload, ws: CustomWebSocket): void => {

  ConnectionManagerInstance.add(payload.username, ws)
  ws.username = payload.username;
}


export const onCloseHandler = (ws: CustomWebSocket): void => {
  if (ws.username) {
    const user = ws.username
    ConnectionManagerInstance.remove(user)
    console.log("add emit broadcast that the user leaved")
  }
}