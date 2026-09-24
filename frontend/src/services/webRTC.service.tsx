import { configuration } from "@/utils/stunServers"
import { socketService } from "./websocket.service"
import { eventBusInstance } from "@/learn/eventBus"
import type { AnswerFromUserPayload, CallEndedPayload, CallRejectedByUserPayload, IceCandidatePayload, OfferFromUserPayload } from "@/types/websocket.types"
import { iceCandidatesInstance, type CandidatePairReport } from "@/components/webRTC/iceCandidates.service"


interface InitiateCallPayload {
  stream: MediaStream
  call_to: string,
  myUsername: string
}

class WebRTC {

  private pc: null | RTCPeerConnection = null
  private iceCandidatesBufferQueue: RTCIceCandidate[] = []
  public remoteOffer: RTCSessionDescriptionInit | null = null
  constructor() {
    this.setupSignalingIncoming()
  }

  private setupSignalingIncoming() {
    eventBusInstance.subscribe("ICE_CANDIDATE_TO_USER", (payload: IceCandidatePayload) => this.handleIncomingIceCandidates(payload))
    eventBusInstance.subscribe("CALL_REJECTED_BY_USER", (payload: CallRejectedByUserPayload) => this.handleCallRejectedByUser(payload))
    eventBusInstance.subscribe("CALL_ENDED", (payload: CallEndedPayload) => this.endCall(payload))
    eventBusInstance.subscribe("OFFER_FROM_USER", (payload: OfferFromUserPayload) => this.receiveCall(payload))
    eventBusInstance.subscribe("ANSWER_FROM_USER", (payload: AnswerFromUserPayload) => this.handleIncomingAnswer(payload))
  }

  private handleCallRejectedByUser(payload: CallRejectedByUserPayload) {
    const { from, to } = payload
    console.log("call rejected by peer, clearing variables...")
    console.log("add validation here to check if the message received is from a correct peer , from:", from, "to: ", to);
    this.pc = null
    this.remoteOffer = null
    this.iceCandidatesBufferQueue = []
    this.onRemoteStreamReceived = null
    console.log("cleared variables")

  }
  /**
   * initiateCall
   */

  // get the permission from the frontend hook, we have the tracks from the frontend
  public async initiateCall(payload: InitiateCallPayload) {

    try {

      this.pc = new RTCPeerConnection(configuration)
      const { call_to, myUsername, stream } = payload


      this.pc.onicecandidate = e => this.handleOnIceCandidateEvent(e, myUsername, call_to)
      this.pc.ontrack = e => this.handleOntrack(e)
      this.pc.onconnectionstatechange = () => {
        console.log("🔥 Connection State:", this.pc?.connectionState);
      };

      this.pc.oniceconnectionstatechange = () => {
        console.log("❄️ ICE Connection State:", this.pc?.iceConnectionState);
      };
      for (const track of stream.getTracks()) {
        this.pc.addTrack(track, stream)
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
      console.error("error in initiating call: ", err)
    }

  }

  /**
   * receiveCall
   */
  public async receiveCall(payload: OfferFromUserPayload) {
    try {
      const { offer } = payload
      this.pc = new RTCPeerConnection(configuration)
      this.pc.ontrack = e => this.handleOntrack(e)
      this.remoteOffer = offer
      await this.pc.setRemoteDescription(offer)
    } catch (err) {
      console.log("error in receive call: ", err)
    }
  }

  public endCall(payload: CallEndedPayload) {
    try {
      this.pc?.getSenders().forEach((sender) => sender.track?.stop())
      this.pc?.close()
      this.pc = null
      this.iceCandidatesBufferQueue = []
      this.remoteStream = null
    } catch (err) {
      console.log("Error in end Call: ", err)
    }
  }
  // function after initial exchange 
  //
  public async rejectCall(payload: {
    from: string,
    to: string,
  }) {
    try {
      if (!this.pc) {
        return;
      }
      const { from, to } = payload
      socketService.emit({
        type: 'REJECTED',
        payload: {
          from: from,
          to: to
        }
      })
      this.iceCandidatesBufferQueue = []
      this.remoteOffer = null;
      console.log("call rejected... variables cleaned up...")
    } catch (err) {
      console.log("error in rejectCall: ", err)
    }
  }

  public async sendAnswer(payload: {
    from: string,
    to: string,
    stream: MediaStream
  }) {
    try {

      const { from, to, stream } = payload
      if (!this.pc) {
        throw new Error("no peer Connection found");
      }
      if (!from || !to) {
        console.log("arguemnets not passed, from and to in sendAnswer func...")
        throw new Error("No arguemnets found")

      }

      this.pc.onicecandidate = e => this.handleOnIceCandidateEvent(e, from, to)

      for (const track of stream.getTracks()) {
        this.pc.addTrack(track, stream)
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
      console.log('error in sendAnswer: ', err)

    }
  }
  public async handleIncomingAnswer(payload: AnswerFromUserPayload) {
    try {
      if (!this.pc) {
        console.log("rtc connection not found, handle incoming answer...")
        return;
      }
      const { answer } = payload
      await this.pc.setRemoteDescription(answer)
      await this.handleBufferedIceCandidates()

    } catch (err) {
      console.log('error in handleIncomingAnswer: ', err)
    }
  }

  public async handleIncomingIceCandidates(payload: IceCandidatePayload) {


    const { iceCandidate } = payload
    if (!iceCandidate) {
      console.error("no ice candidate received in this payload")
      return;
    }
    iceCandidatesInstance.trackCandidates(iceCandidate, "remote")
    if (!this.pc?.currentRemoteDescription) {
      this.iceCandidatesBufferQueue.push(iceCandidate)
      console.log("ice candidate added to the buffer queue")
      return
    }
    // await this.handleBufferedIceCandidates()
    this.pc.addIceCandidate(iceCandidate)
    console.log("ice candidate added to the list")
  }

  private async handleBufferedIceCandidates() {
    while (this.iceCandidatesBufferQueue.length > 0) {
      const candidate = this.iceCandidatesBufferQueue.shift()
      await this.pc?.addIceCandidate(candidate)
    }
  }

  private onRemoteStreamReceived: ((stream: MediaStream) => void) | null = null
  private remoteStream: MediaStream | null = null

  public setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamReceived = callback
    if (this.remoteStream) {
      console.log("use the saved stream")
      callback(this.remoteStream)
    }
  }

  private handleOntrack(e: RTCTrackEvent) {
    if (e.streams && e.streams[0]) {
      // this shit is nothing but just checking if onremotestreamreceived is null or a function, if its a function, we pass in the streams[0] as argument and call the function
      console.log("stream found...")
      this.remoteStream = e.streams[0]
      this.onRemoteStreamReceived?.(this.remoteStream)
    }
  }
  private handleOnIceCandidateEvent(e: RTCPeerConnectionIceEvent, from: string, to: string) {

    if (!e.candidate) {
      console.log("ice candidate not in the event")
      return;
    }
    iceCandidatesInstance.trackCandidates(e.candidate, "local")
    socketService.emit({
      type: "NEW_ICE_CANDIDATE",
      payload: {
        from: from,
        to: to,
        iceCandidate: e.candidate
      }
    })
  }
  public async handleCallEnd(payload: CallEndedPayload) {

    const { from, to } = payload
    if (!from || !to) {
      console.error("ARGUEMNTS NOT PASSED CORRECTLY")
      return;
    }
    socketService.emit({
      type: "CALL_ENDED", payload: {
        from: from,
        to: to
      }
    })
    this.endCall({ from: from, to: to })
    console.log("sending the call end request to remote peer")
  }

  public async peerConnectionStats(): Promise<RTCStatsReport | null> {
    const stats = await this.pc?.getStats()
    console.log("stats: ", stats)
    if (!stats) {
      return null;
    }

    stats.forEach((report) => {
      console.log("report type: ", report.type)

      switch (report.type) {
        case "inbound-rtp": {
          const r = report as RTCInboundRtpStreamStats
          console.log("report type is inbound-rtp")
          break;
        }
        case "outbound-rtp": {
          const r = report as RTCOutboundRtpStreamStats
          console.log("report type is outbound-rtp")
          break;
        }
        default: {
          console.log("rest of the types...")
          break;
        }
      }
    });
    return stats;
  }
  public async getCurrentConnectionStats(): Promise<CandidatePairReport | undefined> {
    console.log("get senders: ", this.pc?.getSenders())
    if (!this.pc) {
      console.log("PLEASE WAIT FOR THE CONNECTION TO ESTABLISH")
      return
    }
    this.pc.getSenders().forEach(sender => {

      if (sender.transport) {
        console.log("ice transport: ", sender.transport.iceTransport)
        const iceTransport = sender.transport.iceTransport;
        const selectedPair = iceTransport.getSelectedCandidatePair()
        if (!selectedPair?.local || !selectedPair.remote) {
          console.error("no pair found")
          return;
        }
        const readableStats = iceCandidatesInstance.userReadableFormat(selectedPair)
        console.log("readableStats: ", readableStats)
        return readableStats;
      }
    })
  }
}

export const webRTCInstance = new WebRTC()
