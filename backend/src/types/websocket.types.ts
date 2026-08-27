import type { WebSocket } from "ws";
export interface CustomWebSocket extends WebSocket {
  username?: string;
  isAlive?: boolean;
}



// -------------------------------------------------------------
//                                                            // 
//                                                            //
//                      server side                           //
//                                                            //
// -------------------------------------------------------------


export interface MessageFromUserPayload {
  from_username: string;
  message: string;
}

export interface MessageToAllClientsPayload {
  message: string;
  from_username?: string;
}
export interface ReturnAllActiveClientsPayload {
  clients: string[];
}
export interface ErrorPayload {
  errMsg: string;
  err: Error
}

export type ServerMessage =
  | {
    type: "ERROR";
    payload: ErrorPayload
  }
  | {
      type: "MESSAGE_FROM_USER";
      payload: MessageFromUserPayload;
    }
  | {
      type: "SERVER_PING";
      payload: null
    }
  | {
      type: "TO_ALL_CLIENTS";
      payload: MessageToAllClientsPayload;
    }
  | {
      type: "ALL_ACTIVE_CLIENTS";
      payload: ReturnAllActiveClientsPayload;
    };

export type ServerMessageType = ServerMessage["type"]

// -------------------------------------------------------------
//                                                            // 
//                                                            //
//                      client side                           //
//                                                            //
// -------------------------------------------------------------



export interface SetUsernamePayload {
  username: string;
}

export interface MessageReceivedPayload {
  message: string;
  target_username: string;
}

export interface OfferInitiatorPayload {
  offer: RTCSessionDescriptionInit;
  target_username: string;
}

export type ClientMessage =
  | {
      type: "SET_USERNAME";
      payload: SetUsernamePayload;
    }
  | {
      type: "MESSAGE_RECEIVED";
      payload: MessageReceivedPayload;
    }
  | {
      type: "OFFER_INITIATOR";
      payload: OfferInitiatorPayload;
    }
  | {
      type: "GET_ALL_USERNAMES";
      // payload: GetAllUsernamesPayload;
    };
