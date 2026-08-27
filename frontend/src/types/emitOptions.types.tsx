
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



export type EmitOptions =
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
      payload: null;
    };
