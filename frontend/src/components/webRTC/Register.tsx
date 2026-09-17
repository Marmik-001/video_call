import { useUser } from "@/context/UserContext"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { eventBusInstance } from "@/learn/eventBus"
import { socketService } from "@/services/websocket.service"



const Register = () => {

  const { setCurrentUser, currentUser } = useUser()
  const [usernameInput, setUsernameInput] = useState('')


  const handleUsernameTaken = () => {
    window.alert("Username is taken, please use different username")
    setUsernameInput('')
    setCurrentUser('')

  }
  const handleUsernameEmpty = () => {

    window.alert("Username cannot be empty")
    setUsernameInput('')
    setCurrentUser('')
  }
  useEffect(() => {
    const unsubscribeToUsernameTakenError = eventBusInstance.subscribe("ERROR:USERNAME_TAKEN", handleUsernameTaken)
    const unsubscribeToUsernameEmpty = eventBusInstance.subscribe("ERROR:USERNAME_EMPTY", handleUsernameEmpty)


    return () => {

      unsubscribeToUsernameEmpty()
      unsubscribeToUsernameTakenError()
    }
  })

  const handleUserRegister = async () => {

    if (!usernameInput) {
      console.log("Username cannot be empty, please enter a valid username...")
      return;
    }
    socketService.emit({
      type: "SET_USERNAME",
      payload: {
        username: usernameInput,
      }
    })
    setCurrentUser(usernameInput)
  }
  return (


    <div className="bg-yellow-300 w-full h-full border-2 border-yellow-600 ">
      <input className="bg-black, text-white w-full border-2 border-cyan-700" onChange={(e) => {
        setUsernameInput(e.target.value)
      }} />
      <Button onClick={handleUserRegister}>
        Register
      </Button>
    </ div>
  )

}
export default Register


