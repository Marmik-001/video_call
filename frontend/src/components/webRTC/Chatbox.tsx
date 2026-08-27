import { Button } from "@/components/ui/button"
import { useWs , connectWS } from "@/api/ws"
import { emitEvents } from "@/helper/EmitEvents"
import { useEffect, useRef, useState } from "react"
import { parseWebSocketResponse } from "@/utils/websocket.utils"
import type { ReturnAllActiveClientsPayload } from "@/types/websocketResponse.types"

export const Chatbox: React.FC = () => {
  
  const [username, setUsername] = useState("")
  const wsRef = useRef<WebSocket | null>(null)
  const [error , setError] = useState<Error | null>(null)
  const [allUsernames , setAllUsernames]  = useState<string[]>([])
  const [currentPeer , setCurrentPeer] = useState<string | null>(null)
  const [chatModal , setChatModal] = useState(false)
  const [message, setMessage] = useState('')
  // const { connectWS , disconnectFromWS , error , isLoading , oneToOneMsg , roomCreation }  = useWs()


  const wsOnMessageHandler = (e:MessageEvent) => {
    setError(null)
      console.log("data: " , e.data , "type of data: " , typeof(e.data))
      const res = parseWebSocketResponse(e.data)
      if (res instanceof Error) {
        setError(res)
      } else {
        switch (res.type) {
          case "ALL_ACTIVE_CLIENTS": {
            handleGetAllActiveClients(res.payload , setAllUsernames)
          }
        } 
      }
  }

  const wsOnOpenHandler = () => {
    console.log("connection opened")
  }

  const wsOnCloseHandler = () => {
    console.log("connection closed")
  }

  useEffect(() => {
    

    const ws = new WebSocket('ws://localhost:8080')
    wsRef.current = ws
    

    ws.onopen = () => {
      wsOnOpenHandler()
    }

    ws.onclose = () => {
      wsOnCloseHandler()
    }

    ws.onmessage = (e) => {
      wsOnMessageHandler(e)
    }

    
    return () => {
      ws.close()
      wsRef.current = null
    }
    
  } , [])


  const registerUsername = (username: string) => {
    setError(null)
    if (wsRef.current) {
      emitEvents(wsRef.current, {
        type: "SET_USERNAME", 
        payload: {
          username:username
        }
      })
    } else {
      const e = new Error("Connection not found")
      setError(e)
    }
  }

  const sendMessageToUser = (username: string, value: string) => {
    setError(null)
    if (wsRef.current) {
      emitEvents(wsRef.current, {
        type: "", 
        payload: {
          username:username
        }
      })
    } else {
      const e = new Error("Connection not found")
      setError(e)
    }
  }

  const getAllUsers = () => {
    setError(null)
    if (wsRef.current) {

      emitEvents(wsRef.current, {
        type: "GET_ALL_USERNAMES",
        payload: null
      })
    } else {
      const e = new Error("Connection not found")
      setError(e)
      // const mediaError = e instanceof Error ? new Error('failed to access media devices')
    }
  }
  
  const handleGetAllActiveClients = (payload: ReturnAllActiveClientsPayload , setAllUsernames: React.Dispatch<React.SetStateAction<string[]>>) => {

    const { clients } = payload    
    setAllUsernames(clients)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <input
          onChange={(e) => {
            setUsername(e.target.value)
          }}
          value={username}
          className="bg-black, text-white w-100 border-2 border-cyan-700"
        />

        <Button onClick={() => {
          registerUsername(username)
        }}> Join rooms with this name </Button>
      </div>
      <Button onClick={() => {
        getAllUsers()
      }}>
        get all users
      </Button>
      <ul className="bg-gray-300">
        {
          allUsernames.length > 0 ? 
          (
            <div>
              {
                allUsernames.map((username) => {
                  return (
                    <div>
                      <p>{username}</p>
                      <Button onClick={() => {
                        setCurrentPeer(username)
                        setChatModal(true)
                      }}> send message to user </Button>
                      {chatModal && (
                        <div>
                          <input  type="text" className="bg-red-200 mt-4 m-2 p-4" onChange={(e) => setMessage(e.target.value)} />
                          <Button onClick={() => {
                            
                          }}>Send</Button>
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </div>
          ):
          (
            <div className="bg-red-400 p-2 m-2 size-10  content-center rounded-xl w-1/2">
              <p className="bg-blue-300 text-center rounded-2xl">
              No Users
              </p>
              
              </div>
          )
        }
      </ul>
    </div>
  )
}