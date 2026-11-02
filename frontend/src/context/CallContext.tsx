import React, { useEffect, useRef, useState } from "react";
import { useUser } from "./useUser";
import { CallContext, type CallDetailsType } from "./callContextDef";

export const CallContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentUsernameRef } = useUser();
  const [details, setDetails] = useState<CallDetailsType>({
    caller: null,
    status: "IDLE",
    receiver: null,
  });

  const callDetailsRef = useRef(details);
  useEffect(() => {
    callDetailsRef.current = details;
  }, [details]);

  const setIdle = () => {
    setDetails({
      caller: null,
      receiver: null,
      status: "IDLE",
    });
  };

  const setOngoing = (payload: { caller: string; receiver: string }) => {
    const { caller, receiver } = payload;
    if (!caller || !receiver) {
      console.log("caller or receiver not passed to the argument");
      return;
    }
    setDetails({
      caller: caller,
      receiver: receiver,
      status: "ONGOING",
    });
  };

  const setIncoming = (caller: string) => {
    if (!caller) {
      console.log("no caller argument passed in call status");
      return;
    }
    setDetails({
      caller: caller,
      receiver: currentUsernameRef.current || currentUser,
      status: "INCOMING",
    });
  };

  const setOutgoing = (receiver: string) => {
    if (!receiver) {
      console.log("no receiver found in call status");
      return;
    }
    setDetails({
      caller: currentUsernameRef.current || currentUser,
      receiver: receiver,
      status: "OUTGOING",
    });
  };

  return (
    <CallContext.Provider
      value={{
        callDetailsRef: callDetailsRef,
        callDetails: details,
        setIdle,
        setIncoming,
        setOngoing,
        setOutgoing,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
