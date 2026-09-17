import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import type { AnswerPayload, CallRejectedByUserPayload, MessageFromUserPayload, OfferFromUserPayload, ReturnAllActiveClientsPayload } from "@/types/websocket.types"
import { socketService, socketService as ws } from "@/services/websocket.service"
import { eventBusInstance } from "@/learn/eventBus"
import { webRTCInstance } from "@/services/webRTC.service"
import { useUserMedia } from "@/hooks/useUserMedia"

type InboxType = {
  username: string,
  message: string
}
export const Chatbox: React.FC = () => {

  const [currUsername, setCurrUsername] = useState("")
  const usernameRef = useRef("")
  const [error, setError] = useState<Error | null>(null)
  const [allUsernames, setAllUsernames] = useState<string[]>([])
  const [chatModal, setChatModal] = useState(false)
  const [message, setMessage] = useState('')
  const [inbox, setInbox] = useState<InboxType[]>([])
  const { requestPermission, stopStream, stream, error: streamError } = useUserMedia({ video: true, audio: true })
  const [incomingCall, setIncomingCall] = useState<{
    from: string,
    ringing: boolean
  }>({
    from: "",
    ringing: false
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {

    const ubsubscribeHandleAllActiveClients = eventBusInstance.subscribe("ALL_ACTIVE_CLIENTS", handleGetAllActiveClients)
    const ubsubscribeToRegisterUsername = eventBusInstance.subscribe("MESSAGE_FROM_USER", handleMessageFromUser)
    const ubsubscribeToUsernameTakenError = eventBusInstance.subscribe("ERROR:USERNAME_TAKEN", handleUsernameTaken)
    // const ubsubscribeToOffer = eventBusInstance.subscribe("OFFER_FROM_USER", handleIncomingOffer)
    const unsubscribeToAnswer = eventBusInstance.subscribe("ANSWER_FROM_USER", handleAnswer)
    const ubsubscribeToCallRejected = eventBusInstance.subscribe("CALL_REJECTED_BY_USER", handleCallRejectedByUser)
    const ubsubscribeToCallEnded = eventBusInstance.subscribe("CALL_ENDED", handleCallEnd)
    webRTCInstance.setOnRemoteStream((stream) => {
      if (!videoRef.current || !stream) {
        return
      }
      videoRef.current.srcObject = stream
    })

    return () => {
      ubsubscribeHandleAllActiveClients()
      ubsubscribeToRegisterUsername()
      ubsubscribeToUsernameTakenError()
      // ubsubscribeToOffer()
      unsubscribeToAnswer()
      ubsubscribeToCallRejected()
      ubsubscribeToCallEnded()
    }
  }, [])

  const handleMessageFromUser = (payload: MessageFromUserPayload) => {
    const { from_username, message } = payload
    setInbox((prev) => [...prev, {
      username: from_username,
      message: message,
    }])

  }


  const handleCallRejectedByUser = (payload: CallRejectedByUserPayload) => {

    console.log("rejected : ", payload.from)
    window.alert("USER DECLINED THE CALL REQUEST")
    videoRef.current = null
    stopStream()
    setIncomingCall({
      from: "",
      ringing: false
    })
    webRTCInstance.endCall()

  }
  const handleAnswer = async (payload: AnswerPayload) => {
    const { answer, from, to } = payload
    await webRTCInstance.handleIncomingAnswer({
      currUser: to,
      to: from,
      answer: answer
    })
  }

  // todo: handle the calling logic
  const handleIncomingOffer = async (payload: OfferFromUserPayload) => {
    const { from, offer, to } = payload
    await webRTCInstance.receiveCall({
      call_from: from,
      myUsername: to,
      remoteOffer: offer,
    })
    setIncomingCall({
      from: from,
      ringing: true
    })
  }
  const registerUsername = (username: string) => {
    setError(null)
    if (username === '') {
      window.alert("Username cannot be empty")
      return;
    }
    ws.emit({
      type: "SET_USERNAME",
      payload: {
        username: username
      }
    })
  }
  const handleUsernameTaken = () => {
    setCurrUsername('')
    usernameRef.current = ''
    // console.log("username taken")
    window.alert("Username is already taken")
  }

  const sendMessageToUser = (username: string, value: string) => {
    ws.emit({
      type: "MESSAGE_RECEIVED",
      payload: {
        message: value,
        target_username: username
      }
    })
  }

  const getAllUsers = () => {
    setError(null)
    ws.emit({
      type: "GET_ALL_USERNAMES",
    })
  }

  const handleCallToUsername = async (call_to_username: string) => {
    const streamRes = await requestPermission()
    if (streamRes === null) {
      console.log('stream error: ', streamError)
      return
    }
    if (!currUsername) {
      console.log("current username does not exist")
      return
    }
    webRTCInstance.initiateCall({ stream: streamRes, call_to: call_to_username, myUsername: currUsername })
    // here incoming is actually who we are calling
    setIncomingCall({
      from: call_to_username,
      ringing: true
    })
  }

  const handleCallEnd = async () => {
    stopStream()
    webRTCInstance.endCall()
  }

  const handleGetAllActiveClients = (payload: ReturnAllActiveClientsPayload) => {

    const { clients } = payload
    const newClients = clients.filter((name) => {
      return name !== usernameRef.current
    })
    setAllUsernames(newClients)
  }

  return (
    <div className="flex flex-col">
      <div className="border-2">
        <h1 className="text-xl text-white border-2 p-2 m-2 "> Incoming calls </h1>
        <div>
          {incomingCall.ringing ?
            (<div>
              <p className="text-lg p-2 m-2 text-shadow-amber-400">incoming call form {incomingCall.from} </p>
              <Button onClick={async () => {
                const streamRes = await requestPermission()
                if (streamRes === null) {
                  console.log('stream error: ', streamError)
                  return
                }
                webRTCInstance.sendAnswer({
                  from: currUsername,
                  to: incomingCall.from,
                  stream: streamRes
                })
              }}>
                Accept
              </Button>
              <Button onClick={() => {

                if (!usernameRef.current) {
                  console.log("handle username removed in between error here...")
                  return;
                }
                webRTCInstance.rejectCall({
                  from: usernameRef.current,
                  to: incomingCall.from,
                })
                setIncomingCall({
                  from: "",
                  ringing: false
                })
                console.log("handle call rejected here, send emit to the caller")
              }}>
                Reject
              </Button>
            </div>) :
            (<div>
              No incoming calls
            </div>)}
        </div>
      </div>
      <div className="flex flex-row">
        <input
          onChange={(e) => {
            setCurrUsername(e.target.value)
            usernameRef.current = e.target.value
          }}
          value={currUsername}
          className="bg-black, text-white w-100 border-2 border-cyan-700"
        />

        <Button onClick={() => {
          registerUsername(currUsername)
        }}> Join rooms with this name </Button>
      </div>
      <Button onClick={() => {
        getAllUsers()
      }}>
        get all users
      </Button>
      <div className="bg-gray-300">
        {
          allUsernames.length > 0 ?
            (
              <ul>
                {
                  allUsernames.map((username) => {
                    return (
                      <div key={username}>
                        <p>{username}</p>
                        <Button onClick={() => {
                          setChatModal(true)
                        }}> send message to user </Button>
                        {chatModal && (
                          <div>
                            <input type="text" className="bg-red-200 mt-4 m-2 p-4" onChange={(e) => setMessage(e.target.value)} />
                            <Button onClick={() => {
                              sendMessageToUser(username, message)
                            }}>Send</Button>
                            <Button onClick={() => {
                              handleCallToUsername(username)
                            }}>Call</Button>
                            <Button onClick={() => {
                              ws.emit({
                                type: "CALL_ENDED",
                                payload: {
                                  from: usernameRef.current,
                                  to: incomingCall.from
                                }
                              })
                              handleCallEnd()
                            }}>end call</Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                }
              </ul>
            ) :
            (
              <div className="bg-red-400 p-2 m-2 size-10  content-center rounded-xl w-1/2">
                <p className="bg-blue-300 text-center rounded-2xl">
                  No Users
                </p>

              </div>
            )
        }
      </ div>
      <div className="bg-purple-200">
        {
          inbox.length > 0 ? (
            inbox.map(({ message, username }) => {
              return (
                <div key={username}>
                  {username} : {message}
                </div>
              )
            })
          ) : (
            <div>
              NO MESSEGES YET
            </div>
          )
        }
      </div>
      <div>
        hello world
        <video ref={videoRef} autoPlay playsInline className="border-2 w-full h-full" />
      </div>

    </div>
  )
}
