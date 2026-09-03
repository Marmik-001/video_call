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

    private pc: null | RTCPeerConnection = null
    private iceCandidatesBufferQueue : RTCIceCandidate[] = []
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
            
            this.pc.ontrack = e => this.handleOntrack(e)

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
            await this.handleIncomingIceCandidates()
            for (const track of stream.getTracks()) {
                this.pc.addTrack(track)
            }

            this.pc.onicecandidate = e =>  this.handleOnIceCandidateEvent(e, myUsername , call_from)
            this.pc.ontrack = e => this.handleOntrack(e)
        } catch (err) {
            
        }
    }

    public async handleIncomingIceCandidates() {
        
        if
        while (this.iceCandidatesBufferQueue.length > 0) {
            const candidate = this.iceCandidatesBufferQueue.shift()
            this.pc?.addIceCandidate(candidate)
        }
    }

    private onRemoteStreamReceived: ((stream:MediaStream) => void) | null = null

    public setOnRemoteStream(callback: (stream:MediaStream) => void )  {
        this.onRemoteStreamReceived = callback
    }

    private handleOntrack(e:RTCTrackEvent) {
        if (e.streams && e.streams[0]) {
            // this shit is nothing but just checking if onremotestreamreceived is null or a function, if its a function, we pass in the streams[0] as argument and call the function
            console.log("stream found...")
            this.onRemoteStreamReceived?.(e.streams[0])
        }
    }
    private handleOnIceCandidateEvent(e: RTCPeerConnectionIceEvent, from: string, to: string ) {

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