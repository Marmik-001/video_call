import { eventBusInstance } from "@/learn/eventBus"
import { webRTCInstance } from "@/services/webRTC.service"
import type { AnswerFromUserPayload, OfferFromUserPayload } from "@/types/websocket.types"
import { useEffect } from "react"
import { Button } from "../ui/button"
import { useUserMedia } from "@/hooks/useUserMedia"
import { useUser } from "@/context/UserContext"
import { useCallStatus } from "@/context/CallContext"
import { socketService } from "@/services/websocket.service"

const ActiveCallBanner = () => {


  const { currentUser, currentUsernameRef } = useUser()
  const { callDetailsRef, callDetails, setIdle, setIncoming, setOngoing } = useCallStatus()
  const { error, requestPermission, stopStream } = useUserMedia({ audio: true, video: true })

  const handleIncomingOffer = async (payload: OfferFromUserPayload) => {
    const { from } = payload
    setIncoming(from)
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
  const handleEndCall = async () => {
    let sendEventTo = callDetails.caller
    if (callDetails.caller === currentUser) {
      sendEventTo = callDetails.receiver
    }
    if (!sendEventTo) {
      console.error("did not find the other party to cut the call...")
      return
    }
    webRTCInstance.handleCallEnd({ from: currentUser, to: sendEventTo })
    stopStream()
    setIdle()
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
    setIdle()
  }

  const handleIncomingAnswer = (payload: AnswerFromUserPayload) => {
    const { from } = payload
    setOngoing({
      caller: currentUser,
      receiver: from
    })
  }

  const handleCallRejectedByUser = async () => {
    stopStream()
    setIdle()
  }
  const handleEndCallByUser = () => {
    stopStream()
    console.log("other party ended the call...")
    setIdle()
  }
  useEffect(() => {

    const ubsubscribeToOffer = eventBusInstance.subscribe("OFFER_FROM_USER", handleIncomingOffer)
    const ubsubsribeToAnswer = eventBusInstance.subscribe("ANSWER_FROM_USER", handleIncomingAnswer)
    const ubsubscribeToCallEnd = eventBusInstance.subscribe("CALL_ENDED", handleEndCallByUser)
    const ubsubscribeToCallRejectedByUser = eventBusInstance.subscribe("CALL_REJECTED_BY_USER", handleCallRejectedByUser)
    return () => {
      ubsubscribeToOffer()
      ubsubscribeToCallEnd()
      ubsubscribeToCallRejectedByUser()
      ubsubsribeToAnswer()
    }
  })

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
export default ActiveCallBanner


