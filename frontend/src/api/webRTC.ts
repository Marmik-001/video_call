import { useEffect, useRef, useState } from "react";
import { configuration } from "@/utils/stunServers";
// import { runAsync  } from "@/helper/ErrorHandlers";
// import type { asyncStateActions } from "@/helper/ErrorHandlers";
import React from "react";
interface UseWebRTCConnectionReturn {
  isLoading: boolean;
  error: Error | null;
  connectionRef: React.RefObject<RTCPeerConnection | null>;
  iceCandidates: RTCIceCandidate[] | [];
  initializerPeer: () => void;
  receiverPeer: (remoteOffer: RTCSessionDescriptionInit) => void;
  addRemoteIceCandidatesFromList: (candidates: RTCIceCandidate[]) => void;
  addRemoteDescription: (description: RTCSessionDescriptionInit) => void;
  createAnswer: () => Promise<RTCSessionDescriptionInit | null > ;
  sendMsg: (m: string) => Error | null;
  msg: Msg[];
  getLocalDescription: () => Promise<RTCLocalSessionDescriptionInit | null>
}

const dataChannelName = "msgChannel";

export type Msg = {
  msgType: "sent" | "received";
  content: string;
};
// options: UseWebRTCConnectionOptions
export const useWebRTCConnection = (): UseWebRTCConnectionReturn => {
  // const { remoteOffer, remoteAnswer } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const [iceCandidates, setIceCandidates] = useState<RTCIceCandidate[]>([]);
  const [msg, setMsg] = useState<Msg[]>([]);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const peerConnection = async (caller: "initializer" | "receiver"): Promise<RTCPeerConnection | null> => {
    if (connectionRef.current) {
      return null;
    }
    try {
      const conn: RTCPeerConnection = new RTCPeerConnection(configuration);

      if (caller === "initializer") {
        const dc = conn.createDataChannel(dataChannelName);
        dc.onopen = dataChannelOnOpen;
        dc.onmessage = dataChannelOnMessage;
        dc.onclose = dataChannelOnClose;
        dataChannelRef.current = dc;
      } else if (caller === "receiver") {
        conn.ondatachannel = (e) => {
          const dc = e.channel;
          dc.onopen = dataChannelOnOpen;
          dc.onmessage = dataChannelOnMessage;
          dc.onclose = dataChannelOnClose;
          dataChannelRef.current = dc;
        };
      }

      conn.onicecandidate = onIceCandidateFound;
      connectionRef.current = conn;
      setError(null);
      return conn;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
      return null;
    }
  };

  // const asyncStates: asyncStateActions = {
  //   setIsLoading:setIsLoading,
  //   setError : setError
  // }

  const initializerPeer = async () => {
    if (connectionRef.current) {
      return;
    }
    try {
      setIsLoading(true);
      const conn = await peerConnection("initializer");
      if (!conn) {
        return;
      }
      const localOffer = await conn.createOffer();
      await conn.setLocalDescription(localOffer);
      connectionRef.current = conn;
      setError(null);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalDescription = async () => {
    if (!connectionRef.current) {
      return null;
    }
    try {
      setIsLoading(true);
      setError(null);
      return  connectionRef.current.localDescription
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
      return null
    } finally {
      setIsLoading(false);
    }
  }

  const receiverPeer = async (remoteOffer: RTCSessionDescriptionInit) => {
    if (connectionRef.current) {
      return;
    }
    try {
      setIsLoading(true);
      const conn = await peerConnection("receiver");
      if (!conn) {
        return;
      }
      await conn.setRemoteDescription(remoteOffer);
      connectionRef.current = conn;
      setError(null);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const addRemoteIceCandidatesFromList = async (
    candidates: RTCIceCandidate[],
  ) => {
    try {
      if (connectionRef.current) {
        for (const candidate of candidates) {
          await connectionRef.current.addIceCandidate(candidate);
        }
        setError(null);
      } else {  
        setError(new Error("No connection found"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
    }
  };

  const addRemoteDescription = async (
    description: RTCSessionDescriptionInit,
  ) => {
    try {
      if (connectionRef.current) {
        await connectionRef.current.setRemoteDescription(description);
        setError(null);
      } else {
        setError(new Error("No connection found"));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
    }
  };

  const createAnswer = async () => {
    try {
      if (connectionRef.current) {
        const ans = await connectionRef.current.createAnswer();
        await connectionRef.current.setLocalDescription(ans);
        setError(null);
        return ans;
      } else {
        return null;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(new Error(errMsg));
      return null;
    }
  };

  const sendMsg: (m: string) => Error | null = (m) => {
    if (!dataChannelRef.current) {
      setError(new Error("No data channel found"));
      return new Error("No data channel found");
    }

    if (dataChannelRef.current.readyState === "open") {
      dataChannelRef.current.send(m);
      setError(null);
      return null;
    } else {
      setError(new Error("Data channel not ready yet"));
      return new Error("Data channel not ready yet");
    }
  };

  const onIceCandidateFound = (e: RTCPeerConnectionIceEvent) => {
    console.log("New ice candidate found: ", e);
    if (e.candidate) {
      
      setIceCandidates((prevIceCandidates) => {
        if(!e.candidate) return prevIceCandidates;
        else return [
        ...prevIceCandidates,
        e.candidate,
      ]
    });
    }
  };

  const dataChannelOnOpen = () => {
    console.log("data channel opened successfully");
  };

  const dataChannelOnClose = () => {
    console.log("Data channel closed");
    dataChannelRef.current = null;
  };

  const dataChannelOnMessage = (e: MessageEvent) => {
    console.log("msg: ", e.data);
    const msgObj: Msg = {
      msgType: "received",
      content: e.data,
    };
    setMsg((prevMsg) => [...prevMsg, msgObj]);
  };

  useEffect(() => {

    return () => {
      dataChannelRef.current = null;
      connectionRef.current = null;
    } 
    
  } , [])

  return {
    initializerPeer,
    receiverPeer,
    addRemoteIceCandidatesFromList,
    addRemoteDescription,
    createAnswer,
    isLoading,
    error,
    connectionRef,
    iceCandidates,
    sendMsg,
    msg,
    getLocalDescription
  };
};
