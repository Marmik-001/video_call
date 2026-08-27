import { emitEvents } from "@/helper/EmitEvents"
import { useState } from "react"

interface UseWsReturn {
  error: Error | null
  isLoading: boolean
  // ws: WebSocket | null
  oneToOneMsg: ( peerWS:WebSocket) => void
  roomCreation: ( roomName:string ) => void
  disconnectFromWS: ( WS:WebSocket ) => void
  // connectWS: (username:string) => WebSocket
}

export const connectWS = () => {
  const ws = new WebSocket('ws://localhost:8080')
  
  ws.onopen = (e) => {
    console.log("connection opened with the server (event): " , e)
  }
  // emitEvents(ws, {
  //   type: "SET_USERNAME",
  //   payload: {
  //     username:username
  //   }
  // })
  return ws
}


export const useWs = ():UseWsReturn => {

  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)



  const oneToOneMsg = (peerWS:WebSocket) => {
    
  }

  const roomCreation = (roomName:string) => {
    
  }

  const disconnectFromWS = (ws:WebSocket) => {
    
  }
  return {
    error, 
    isLoading,
    // connectWS,
    oneToOneMsg,
    roomCreation,
    disconnectFromWS,
  }
}