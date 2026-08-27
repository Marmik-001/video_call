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