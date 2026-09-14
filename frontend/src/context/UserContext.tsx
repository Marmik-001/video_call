
import React, { createContext, useContext, useEffect, useRef, useState } from "react";


interface UserContextType {
  currentUser: string,
  setCurrentUser: (name: string) => void
  currentUsernameRef: React.RefObject<string>
}


const userContext = createContext<UserContextType | null>(null)


export const UseUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [currentUser, setCurrentUserState] = useState("")
  const currentUsernameRef = useRef("")
  const setCurrentUser = (name: string) => {
    if (!name) {
      console.log("username cannot be empty")
      return;
    }
    currentUsernameRef.current = name
    setCurrentUserState(name)
  }


  return (
    <userContext.Provider value={{ currentUsernameRef, setCurrentUser, currentUser }}>
      {children}
    </userContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(userContext)
  if (!context) {
    throw new Error("please use context inside the context provider block")
  }
  return context;
}
