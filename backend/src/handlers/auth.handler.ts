import { ConnectionManagerInstance, ConnectionManagerInstance as connections} from "../service/connectionManager.js";
import type { CustomWebSocket, ClientMessage, SetUsernamePayload } from "../types/websocket.types.js";
import { sendError } from "../utils/ws.utils.js";



export const setUsername = (payload: SetUsernamePayload, ws: CustomWebSocket): void => {

  if (ConnectionManagerInstance.has(payload.username)) {
    sendError(ws, {
      code: "USERNAME_TAKEN",
      message: "This username is already taken " + payload.username,
    })
  }
  
  if (payload.username === '') {
    sendError(ws, {
      code: "USERNAME_EMPTY",
      message:"Username cannot be empty"
    })
    return;
  }

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