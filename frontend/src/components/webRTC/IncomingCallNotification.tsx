import { eventBusInstance } from "@/learn/eventBus"
import { webRTCInstance } from "@/services/webRTC.service"
import type { OfferFromUserPayload } from "@/types/websocket.types"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { useUserMedia } from "@/hooks/useUserMedia"
import { useUser } from "@/context/UserContext"

interface IncomingCallNotificationOptions {

}
interface IncomingCallInterface {
  status: "active" | "ringing" | "idle",
  caller: string | null,

}
const IncomingCallNotification = (payload: IncomingCallNotificationOptions) => {


  const { currentUsernameRef } = useUser()
  const { error, requestPermission, stopStream, stream } = useUserMedia({ audio: true, video: true })
  const [incomingCall, setIncomingCall] = useState<IncomingCallInterface>({
    status: "idle",
    caller: null
  })

  const handleIncomingOffer = async (payload: OfferFromUserPayload) => {
    const { from, offer, to } = payload
    await webRTCInstance.receiveCall({
      call_from: from,
      myUsername: to,
      remoteOffer: offer,
    })
    setIncomingCall({
      caller: from,
      status: "ringing"
    })
  }

  const handleCallAccept = async () => {
    const streamRes = await requestPermission()
    if (streamRes === null) {
      console.log('stream error: ', error)
      return
    }
    if (!incomingCall.caller) {
      console.error("no caller name found in handleCallAccept")
      return;
    }
    webRTCInstance.sendAnswer({
      from: currentUsernameRef.current,
      to: incomingCall.caller,
      stream: streamRes
    })
  }
  const handleHoldCall = async () => {

  }
  const handleEndCall = async () => {
    stopStream()
    webRTCInstance.endCall()
  }
  const handleCallReject = async () => {

    if (!currentUsernameRef.current) {
      console.log("handle username removed in between error here...")
      return;
    }
    if (!incomingCall.caller) {
      console.error("no caller name found in handleCallAccept")
      return;
    }
    webRTCInstance.rejectCall({
      from: currentUsernameRef.current,
      to: incomingCall.caller,
    })
    setIncomingCall({
      caller: "",
      status: "idle"
    })
    console.log("handle call rejected here, send emit to the caller")
  }

  const handleCallRejectedByUser = async () => {
    setIncomingCall({ status: "idle", caller: "" })
  }
  useEffect(() => {

    const ubsubscribeToOffer = eventBusInstance.subscribe("OFFER_FROM_USER", handleIncomingOffer)
    const ubsubscribeToCallEnd = eventBusInstance.subscribe("CALL_ENDED", handleEndCall)
    const ubsubscribeToCallRejectedByUser = eventBusInstance.subscribe("CALL_REJECTED_BY_USER", handleCallRejectedByUser)
    return () => {
      ubsubscribeToOffer()
      ubsubscribeToCallEnd()
      ubsubscribeToCallRejectedByUser()
    }
  }, [])

  return (
    <div className="border-2 bg-blue-400 border-blue-600 col-span-3 ">
      {
        incomingCall.status === "ringing" && (
          <div>
            <p>Incoming CALL from {incomingCall.caller}</p>
            <Button onClick={handleCallAccept}>
              Accept
            </Button>
            <Button onClick={handleCallReject}>
              Reject
            </Button>

          </div>
        )
      }
      {
        incomingCall.status === 'active' && (
          <div>
            <p>On Call with {incomingCall.caller}</p>
            <Button onClick={handleHoldCall}>Hold</Button>
            <Button onClick={handleEndCall}>End Call</Button>
          </div>
        )
      }
    </div>
  )
}
export default IncomingCallNotification
