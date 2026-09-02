import { ConnectionManagerInstance } from "../service/connectionManager.js";
import type { CustomWebSocket, NewIceCandidatePayload, OfferPayload } from "../types/websocket.types.js";
import { sendError, sendMessage } from "../utils/ws.utils.js";


export const handleIncomingOffer = (ws:CustomWebSocket, payload: OfferPayload) => {

    const { from, offer, to } = payload 
    const targetUserWs = ConnectionManagerInstance.get(to)
    if (!targetUserWs) {
        sendError(ws, {
            code: "USER_NOT_FOUND",
            message:"cant find users socket"
        })
        return
    }
    sendMessage(targetUserWs , {
        type: "OFFER_FROM_USER",
        payload: {
            from, 
            offer,
            to ,
        }
    })
}


export const handleIceCandidate = (ws: CustomWebSocket, payload: NewIceCandidatePayload) => {
    const { from , iceCandidate , to } = payload
    const targetUserWs = ConnectionManagerInstance.get(to)
    if (!targetUserWs) {
        sendError(ws, {
            code: "USER_NOT_FOUND",
            message:"cant find users socket"
        })
        return
    }
    sendMessage(targetUserWs , {
        type: "ICE_CANDIDATE_TO_USER",
        payload: {
            from, 
            to,
            iceCandidate,
        }
    })
}