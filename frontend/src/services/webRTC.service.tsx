// import { useUserMedia } from "@/hooks/useUserMedia"
import { configuration } from "@/utils/stunServers"
// type ModeType = {
//     audio: boolean 
//     video: boolean
//     screenShare: boolean
// }

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

    private pc:null | RTCPeerConnection = null
    /**
     * initiateCall
     */

    // get the permission from the frontend hook, we have the tracks from the frontend
    public async initiateCall(  payload: InitiateCallPayload ) {
        
        try {
            
            this.pc = new RTCPeerConnection(configuration)
            const { call_to, myUsername, stream } = payload
            
            for (const track of stream.getTracks()) {
                this.pc.addTrack(track)
            }
    
            const offer = await this.pc.createOffer()
            await this.pc.setLocalDescription(offer)
            socketService.emit({
                type: "OFFER",
                payload: {
                    to: call_to,
                    offer: offer,
                    from: myUsername
                }
            })

            this.pc.onicecandidate = e =>  this.handleOnIceCandidateEvent(e , myUsername , call_to )
            
            

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
            this.pc = new RTCPeerConnection(configuration)
            await this.pc.setRemoteDescription(remoteOffer)
            for (const track of stream.getTracks()) {
                this.pc.addTrack(track)
            }

            this.pc.onicecandidate = e =>  this.handleOnIceCandidateEvent(e, myUsername , call_from)
            
            this.pc.ontrack = e => this.handleOntrack(e)
        } catch (err) {
            
        }
    }


    private handleOntrack(e:RTCTrackEvent) {
        
    }
    private handleOnIceCandidateEvent(e: RTCPeerConnectionIceEvent, from: string, to: string) {
        if (!e.candidate) {
            console.log("ice candidate not in the event")
            return;
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