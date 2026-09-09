import { configuration } from "@/utils/stunServers"
import { socketService } from "./websocket.service"
import { eventBusInstance } from "@/learn/eventBus"
import type { IceCandidatePayload } from "@/types/websocket.types"


interface InitiateCallPayload {
    stream: MediaStream
    call_to: string,
    myUsername: string
}
interface ReceiveCallPayload {
    call_from: string,
    myUsername: string
    remoteOffer: RTCSessionDescriptionInit
}

interface HandleIncomingAnswerPayload {
    currUser: string,
    to: string,
    answer: RTCSessionDescriptionInit
}
class WebRTC {

    private pc: null | RTCPeerConnection = null
    private iceCandidatesBufferQueue : RTCIceCandidate[] = []
    public remoteOffer: RTCSessionDescription | null =  null 
    constructor() {
        this.setupSignalingIncoming()
    }

    private setupSignalingIncoming() {
        eventBusInstance.subscribe("ICE_CANDIDATE_TO_USER" , ( payload: IceCandidatePayload ) =>  this.handleIncomingIceCandidates(payload))
    }

    /**
     * initiateCall
     */

    // get the permission from the frontend hook, we have the tracks from the frontend
    public async initiateCall(  payload: InitiateCallPayload ) {
        
        try {
            
            this.pc = new RTCPeerConnection(configuration)
            const { call_to, myUsername, stream } = payload

            
            this.pc.onicecandidate = e => this.handleOnIceCandidateEvent(e, myUsername, call_to)
            this.pc.ontrack = e => this.handleOntrack(e)

            for (const track of stream.getTracks()) {
                this.pc.addTrack(track ,stream)
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

        } catch (err) {
            console.error("error in initiating call: " , err)
        }

    }

    /**
     * receiveCall
     */
    public async receiveCall(payload: ReceiveCallPayload) {
        try {
            const { call_from , myUsername , remoteOffer } = payload
            this.pc = new RTCPeerConnection(configuration)
            this.pc.ontrack = e => this.handleOntrack(e)
            await this.pc.setRemoteDescription(remoteOffer)
        } catch (err) {
            console.log("error in receive call: " , err)
        }
    }

    // function after initial exchange 

    public async sendAnswer(payload: {
        from: string,
        to: string,
        stream: MediaStream
    }) {
        try {
            
            const {from, to  , stream} = payload
            if (!this.pc) {
                throw new Error("no peer Connection found");
            }

            this.pc.onicecandidate = e =>  this.handleOnIceCandidateEvent(e, from , to)
            
            for (const track of stream.getTracks()) {
                this.pc.addTrack(track , stream)
            }
            const answer = await this.pc.createAnswer() 
            await this.pc.setLocalDescription(answer)
            socketService.emit({
                type: "ANSWER",
                payload: {
                    answer,
                    from,
                    to,
                }
            })
            await this.handleBufferedIceCandidates()

        } catch (err) {
            console.log('error in sendAnswer: ',err)
            
        }
    }
    public async handleIncomingAnswer(payload: HandleIncomingAnswerPayload) {
        try {
            if (!this.pc) {
                console.log("rtc connection not found, handle incoming answer...")
                return;
            }
            const {answer , currUser ,to} = payload
            await this.pc.setRemoteDescription(answer)
            // this.pc.onicecandidate = e => this.handleOnIceCandidateEvent(e,currUser ,to)
            // this.pc.ontrack = e => this.handleOntrack(e)
            await this.handleBufferedIceCandidates()

        } catch (err) {
            console.log('error in handleIncomingAnswer: ',err)
        }
    }

    public async handleIncomingIceCandidates(payload: IceCandidatePayload) {
        
        if (!this.pc?.currentRemoteDescription) {
            this.iceCandidatesBufferQueue.push(payload.iceCandidate)
            console.log("ice candidate added to the buffer queue")
            return 
        } 
        // await this.handleBufferedIceCandidates()
        this.pc.addIceCandidate(payload.iceCandidate)
        console.log("ice candidate added to the list")
    }

    private async handleBufferedIceCandidates() {
        while (this.iceCandidatesBufferQueue.length > 0) {
            const candidate = this.iceCandidatesBufferQueue.shift()
            await this.pc?.addIceCandidate(candidate)
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