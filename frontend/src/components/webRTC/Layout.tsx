import { UseUserProvider } from "@/context/UserContext"
import ActiveCallBanner from "./ActiveCallBanner"
import Register from "./Register"
import { CallContextProvider } from "@/context/CallContext"
import UserList from "./UserList"
import UserVideo from "./UserVideo"



const Layout = () => {



  return (
    <UseUserProvider>
      <CallContextProvider>
        <div className="grid grid-cols-3 grid-rows-4 border-black border-3 gap-2 ">
          <ActiveCallBanner />
          <Register />
          <UserList />
          <UserVideo />
        </div>
      </CallContextProvider>
    </ UseUserProvider>
  )
}
export default Layout
