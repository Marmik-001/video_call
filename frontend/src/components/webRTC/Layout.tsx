import { UseUserProvider } from "@/context/UserContext"
import IncomingCallNotification from "./IncomingCallNotification"
import Register from "./Register"



const Layout = () => {



  return (
    <UseUserProvider>
      <div className="grid grid-cols-3 grid-rows-4 border-black border-3 gap-2 ">
        <IncomingCallNotification />
        <Register />
      </div>
    </ UseUserProvider>
  )
}
export default Layout
