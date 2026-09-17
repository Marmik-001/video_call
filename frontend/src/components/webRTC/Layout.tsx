import { UseUserProvider } from "@/context/UserContext"
import IncomingCallNotification from "./IncomingCallNotification"
import Register from "./Register"
import { CallContextProvider } from "@/context/CallContext"



const Layout = () => {



  return (
    <UseUserProvider>
      <CallContextProvider>
        <div className="grid grid-cols-3 grid-rows-4 border-black border-3 gap-2 ">
          <IncomingCallNotification />
          <Register />
        </div>
      </CallContextProvider>
    </ UseUserProvider>
  )
}
export default Layout
