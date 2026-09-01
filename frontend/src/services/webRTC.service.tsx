import { useUserMedia } from "@/hooks/useUserMedia"
import { configuration } from "@/utils/stunServers"
type ModeType = {
    audio: boolean 
    video: boolean
    screenShare: boolean
}

interface InitiateCallPayload {
    stream: MediaStream
    call_to: string,
    myUsername: string
}
interface ReceiveCallPayload {
    stream: MediaStream
    call_from: string,
    myUsername: string
    remoteOffer: RTCSessionDescriptionInit   
}

import { socketService } from "./websocket.service"
class WebRTC {

    /**
     * initiateCall
     */

    // get the permission from the frontend hook, we have the tracks from the frontend
    public async initiateCall(  payload: InitiateCallPayload ) {
        
        try {
            
            const pc = new RTCPeerConnection(configuration)
            const { call_to , myUsername , stream } = payload
            for (const track of stream.getTracks()) {
                pc.addTrack(track)
            }
    
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socketService.emit({
                type: "OFFER",
                payload: {
                    to: call_to,
                    offer: offer,
                    from: myUsername
                }
            })
            pc.onicecandidate = e =>  this.handleOnIceCandidateEvent(e , pc , myUsername , call_to )
            
            

        } catch (err) {
            console.error("error in initiating call: " , err)
        }
        

    }

    /**
     * receiveCall
     */
    public async receiveCall(payload: ReceiveCallPayload) {
        try {

            const { call_from , myUsername , remoteOffer , stream } = payload
            const pc = new RTCPeerConnection(configuration)
            await pc.setRemoteDescription(remoteOffer)
            for (const track of stream.getTracks()) {
                pc.addTrack(track)
            }

            pc.onicecandidate = e =>  this.handleOnIceCandidateEvent(e , pc, myUsername , call_from)
            
            pc.ontrack = e => this.handleOntrack(e , pc)
        } catch (err) {
            
        }
    }


    private handleOntrack(e:RTCTrackEvent , pc:RTCPeerConnection) {
        
    }
    private handleOnIceCandidateEvent(e: RTCPeerConnectionIceEvent, pc: RTCPeerConnection , from:string, to:string) {
        if (!e.candidate) {
            console.log("ice candidate not in the event")
            return
        }
        socketService.emit({
            type: "NEW_ICE_CANDIDATE",
            payload: {
                from: from,
                to: to,
                iceCandidate: e.candidate
            }
        })
    }
}

export const webRTCInstance = new WebRTC()