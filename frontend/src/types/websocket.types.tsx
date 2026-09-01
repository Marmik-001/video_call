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

export type ErrorCode = 
  | "UNAUTHENTICATED"
  | "UNAUTORIZED"
  | "MESSAGE_NOT_SENT"
  | "INTERNAL_SERVER_ERROR"
  | "USER_NOT_FOUND"
  | "USERNAME_TAKEN"

export interface ErrorPayload {
  code: ErrorCode
  message: string;
  targetUser?: string
}

export interface InitialOfferPayload {
  from_username: string;
  offer: RTCSessionDescriptionInit;
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
  }
  | {
    type: "INITIAL_OFFER";
    payload: InitialOfferPayload;
  }

export type ServerMessageType = ServerMessage["type"]
export type ServerMessagePayload = ServerMessage["payload"]


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


export interface NewIceCandidatePayload {
  iceCandidate: RTCIceCandidate
  to: string
  from: string
}

export interface OfferPayload {
  to: string,
  from: string,
  offer: RTCSessionDescriptionInit
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
      type: "GET_ALL_USERNAMES";
  }
  | {
    type: "NEW_ICE_CANDIDATE";
    payload: NewIceCandidatePayload

  }
  | {
    type: "OFFER";
    payload: OfferPayload
  }
