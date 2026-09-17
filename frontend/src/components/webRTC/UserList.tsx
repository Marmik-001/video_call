import { useUser } from "@/context/UserContext"
import { Button } from "../ui/button"
import { socketService } from "@/services/websocket.service"
import { useEffect, useState } from "react"
import { eventBusInstance } from "@/learn/eventBus"
import type { ReturnAllActiveClientsPayload } from "@/types/websocket.types"
import { webRTCInstance } from "@/services/webRTC.service"
import { useUserMedia } from "@/hooks/useUserMedia"
import { useCallStatus } from "@/context/CallContext"




const UserList = () => {


  const [allUsers, setAllUsers] = useState<string[]>([])

  const { currentUser } = useUser()

  const { setOutgoing } = useCallStatus()
  const { requestPermission, error } = useUserMedia()
  const handleGetAllUsers = () => {
    socketService.emit({
      type: "GET_ALL_USERNAMES",
    })
  }

  const handleActiveUsersList = (payload: ReturnAllActiveClientsPayload) => {
    const { clients } = payload
    setAllUsers((clients.filter((e) => e !== currentUser)))
  }

  const handleUnauthentication = () => {
    window.alert("Please register yourself first with enter a username")
  }


  const handleCallToUser = async (user: string) => {

    const streamRef = await requestPermission()

    if (!streamRef) {
      console.error("stream not found in initiating call... request permission")
      console.log("error: ", error)
      return;
    }

    webRTCInstance.initiateCall({
      call_to: user,
      myUsername: currentUser,
      stream: streamRef,
    })

    setOutgoing(user)
  }
  useEffect(() => {

    const ubsubscribeToUsernameList = eventBusInstance.subscribe("ALL_ACTIVE_CLIENTS", handleActiveUsersList)
    const unsubscribeToUnauthenticated = eventBusInstance.subscribe("ERROR:UNAUTHENTICATED", handleUnauthentication)


    return () => {
      ubsubscribeToUsernameList()
      unsubscribeToUnauthenticated()
    }
  })

  return (
    <div className="text-black bg-white border-2 border-gray-400 p-2 m-2 w-full h-full">
      <p>
        Online Users
      </p>

      <Button onClick={handleGetAllUsers}>
        Get Users
      </ Button>
      {
        allUsers && allUsers.map((user) => {
          return (
            <div>
              <p>{user}</p>
              <Button> Message </Button>
              <Button onClick={() => handleCallToUser(user)}> Call </Button>
            </div>
          )
        })
      }
    </div>
  )
}



export default UserList
