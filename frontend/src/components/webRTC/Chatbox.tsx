import { Button } from "@/components/ui/button"
import { emitEvents } from "@/helper/EmitEvents"
import { useEffect, useRef, useState } from "react"
import { parseWebSocketResponse } from "@/utils/websocket.utils"
import type { MessageFromUserPayload, ReturnAllActiveClientsPayload } from "@/types/websocket.types"
import { socketService as ws } from "@/services/websocket.service"
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
  const wsRef = useRef<WebSocket | null>(null)
  const [error , setError] = useState<Error | null>(null)
  const [allUsernames , setAllUsernames]  = useState<string[]>([])
  const [currentPeer , setCurrentPeer] = useState<string | null>(null)
  const [chatModal , setChatModal] = useState(false)
  const [message, setMessage] = useState('')
  const [inbox , setInbox] = useState<InboxType[]>([])
  const {  requestPermission , stopStream , stream , error: streamError  } = useUserMedia({video:true , audio:true})
  
  useEffect(() => {
    
    const ubsubscribeHandleAllActiveClients = eventBusInstance.subscribe("ALL_ACTIVE_CLIENTS", handleGetAllActiveClients)
    const ubsubscribeToRegisterUsername = eventBusInstance.subscribe("MESSAGE_FROM_USER",  handleMessageFromUser)
    const ubsubscribeToUsernameTakenError = eventBusInstance.subscribe("ERROR:USERNAME_TAKEN" , handleUsernameTaken)

    return () => {
      ubsubscribeHandleAllActiveClients()
      ubsubscribeToRegisterUsername()
      ubsubscribeToUsernameTakenError()
    }
  } , [])

  const handleMessageFromUser = (payload: MessageFromUserPayload) => {
    const { from_username, message } = payload
    setInbox((prev) => [...prev, {
      username: from_username,
      message: message,
    } ])
    
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

    webRTCInstance.initiateCall({stream:streamRes ,call_to: call_to_username , myUsername:currUsername })
  }

  const handleCallEnd = async() => {
    stopStream()
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
      <div className="flex flex-row">
        <input
          onChange={(e) => {
            setCurrUsername(e.target.value)
            usernameRef.current =  e.target.value
          }}
          value={currUsername
          }
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
                        setCurrentPeer(username)
                        setChatModal(true)
                      }}> send message to user </Button>
                      {chatModal && (
                        <div>
                          <input  type="text" className="bg-red-200 mt-4 m-2 p-4" onChange={(e) => setMessage(e.target.value)} />
                          <Button onClick={() => {
                            sendMessageToUser(username , message)
                          }}>Send</Button>
                          <Button onClick={() => {
                            handleCallToUsername(username)
                          }}>Call</Button>
                          <Button onClick={() => handleCallEnd()}>end call</Button>
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </ul>
          ):
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
            inbox.map(({message , username}) => {
              return (
                <div key={username}>
                  { username } : { message }
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
    </div>
  )
}