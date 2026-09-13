import { ConnectionManagerInstance } from "../service/connectionManager.js";
import type { AnswerPayload, CallEndedPayload, CustomWebSocket, NewIceCandidatePayload, OfferPayload, RejectedPayload } from "../types/websocket.types.js";
import { sendError, sendMessage } from "../utils/ws.utils.js";


export const handleIncomingOffer = (ws: CustomWebSocket, payload: OfferPayload) => {

  const { from, offer, to } = payload
  const targetUserWs = ConnectionManagerInstance.get(to)
  if (!targetUserWs) {
    sendError(ws, {
      code: "USER_NOT_FOUND",
      message: "cant find users socket"
    })
    return
  }
  sendMessage(targetUserWs, {
    type: "OFFER_FROM_USER",
    payload: {
      from,
      offer,
      to,
    }
  })
}


export const handleIceCandidate = (ws: CustomWebSocket, payload: NewIceCandidatePayload) => {
  const { from, iceCandidate, to } = payload
  const targetUserWs = ConnectionManagerInstance.get(to)
  if (!targetUserWs) {
    sendError(ws, {
      code: "USER_NOT_FOUND",
      message: "cant find users socket"
    })
    return
  }
  sendMessage(targetUserWs, {
    type: "ICE_CANDIDATE_TO_USER",
    payload: {
      from,
      to,
      iceCandidate,
    }
  })
}

export const handleAnswer = (ws: CustomWebSocket, payload: AnswerPayload) => {
  const { answer, from, to } = payload

  const targetUserWs = ConnectionManagerInstance.get(to)
  if (!targetUserWs) {
    sendError(ws, {
      code: "USER_NOT_FOUND",
      message: "cant find users socket"
    })
    return
  }
  sendMessage(targetUserWs, {
    type: "ANSWER_FROM_USER",
    payload: {
      from,
      to,
      answer,
    }
  })
}
export const handleRejected = (ws: CustomWebSocket, payload: RejectedPayload) => {
  const { from, to } = payload

  const targetUserWs = ConnectionManagerInstance.get(to)
  if (!targetUserWs) {
    sendError(ws, {
      code: "USER_NOT_FOUND",
      message: "cant find users socket"
    })
    return;
  }

  if (!ws.username) {
    console.log("NO USERNAME FOUND ATTACHED IN HANDLE REJECTED")
    sendError(ws, {
      code: "UNAUTHENTICATED",
      message: "username is not attached to the websocket... (handleRejected)"
    })
    return;
  }
  console.log("to: ", to, " , from: ", from, " ws.username: ", ws.username)
  sendMessage(targetUserWs, {
    type: "CALL_REJECTED_BY_USER",
    payload: {
      from: ws.username,
      to: to
    }
  })
}
export const handleCallEnded = (ws: CustomWebSocket, payload: CallEndedPayload) => {
  const { from, to } = payload
  const targetUserWs = ConnectionManagerInstance.get(to)
  if (!targetUserWs) {
    sendError(ws, {
      code: "USER_NOT_FOUND",
      message: "username is not attached to the websocket... (handleCallEnded)"
    })
    return;
  }

  if (!ws.username) {
    console.log("NO USERNAME FOUND ATTACHED IN HANDLE REJECTED")
    sendError(ws, {
      code: "UNAUTHENTICATED",
      message: "username is not attached to the websocket... (handleRejected)"
    })
    return;
  }
  sendMessage(targetUserWs, {
    type: "CALL_ENDED",
    payload: {
      from: ws.username,
      to: to
    }
  })
}
