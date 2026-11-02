import React, { useRef, useState } from "react";
import { userContext } from "./userContextDef";

export const UseUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState("");
  const currentUsernameRef = useRef("");
  const setCurrentUser = (name: string) => {
    if (!name) {
      console.log("username cannot be empty");
      return;
    }
    currentUsernameRef.current = name;
    setCurrentUserState(name);
  };

  return (
    <userContext.Provider value={{ currentUsernameRef, setCurrentUser, currentUser }}>
      {children}
    </userContext.Provider>
  );
};
