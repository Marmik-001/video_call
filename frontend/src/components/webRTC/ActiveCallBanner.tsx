import { eventBusInstance } from "@/learn/eventBus"
import { webRTCInstance } from "@/services/webRTC.service"
import type { OfferFromUserPayload } from "@/types/websocket.types"
import { useEffect } from "react"
import { Button } from "../ui/button"
import { useUserMedia } from "@/hooks/useUserMedia"
import { useUser } from "@/context/UserContext"
import { useCallStatus } from "@/context/CallContext"

const IncomingCallNotification = () => {


  const { currentUser, currentUsernameRef } = useUser()
  const { callDetailsRef, callDetails, setIdle, setIncoming, setOngoing, setOutgoing } = useCallStatus()
  const { error, requestPermission, stopStream, stream } = useUserMedia({ audio: true, video: true })

  const handleIncomingOffer = async (payload: OfferFromUserPayload) => {
    const { from } = payload
    setIncoming(from)
    console.log("set incoming here... callcontext function")
  }

  const handleCallAccept = async () => {
    const streamRes = await requestPermission()
    if (streamRes === null) {
      console.log('stream error: ', error)
      return
    }
    if (!callDetailsRef.current.caller) {
      console.log("no caller found in the calldetails ref, cant accept...")
      return
    }
    console.log("this is whate active banner is sending to send answer: calldetailsref caller:", callDetailsRef.current.caller, " current username:  ", currentUsernameRef, " username without ref: ", currentUser)
    webRTCInstance.sendAnswer({
      from: currentUsernameRef.current,
      to: callDetailsRef.current.caller,
      stream: streamRes
    })
    setOngoing({
      caller: callDetailsRef.current.caller,
      receiver: currentUsernameRef.current
    })
  }
  const handleHoldCall = async () => {

  }
  const handleEndCall = async () => {
    stopStream()
    console.log("edit end call bug here too....")
    webRTCInstance.endCall()
  }
  const handleCallReject = async () => {

    if (!currentUsernameRef.current) {
      console.log("handle username removed in between error here...")
      return;
    }
    if (!callDetailsRef.current.caller) {
      console.error("no caller name found in handleCallAccept")
      return;
    }
    webRTCInstance.rejectCall({
      from: currentUsernameRef.current,
      to: callDetailsRef.current.caller,
    })
    console.log("handle call rejected here, send emit to the caller")
  }

  const handleCallRejectedByUser = async () => {
    setIdle()
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
        callDetails.status === "IDLE" && (
          <div>
            <p>NO ON GOING CALL</p>
          </div>

        )
      }
      {
        callDetails.status === "OUTGOING" && (
          <div>
            <p>calling: {callDetails.receiver}</p>
          </ div>
        )
      }
      {
        callDetails.status === "INCOMING" && (
          <div>
            <p>Incoming Call: {callDetails.caller}</p>
            <Button onClick={handleCallAccept}>
              Accept
            </Button>
            <Button onClick={handleCallReject}>
              Reject
            </ Button>
          </div>
        )
      }
      {
        callDetails.status === "ONGOING" && (
          <div>
            <div>

              {
                currentUser === callDetails.caller ? (<p>
                  On Call With {callDetails.receiver}
                </p>) : (<p>
                  On Call With {callDetails.caller}
                </p>)
              }
            </div>
            <Button onClick={handleEndCall}> End Call </Button>
          </div>
        )
      }
    </div>
  )
}
export default IncomingCallNotification


