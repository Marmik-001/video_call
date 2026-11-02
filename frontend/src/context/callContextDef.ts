import { createContext } from "react";

export interface CallDetailsType {
  caller: string | null;
  receiver: string | null;
  status: "IDLE" | 'ONGOING' | 'INCOMING' | 'OUTGOING';
}

export interface CallContextType {
  callDetails: CallDetailsType;
  callDetailsRef: React.RefObject<CallDetailsType>;
  setIdle: () => void;
  setOngoing: (payload: { caller: string; receiver: string }) => void;
  setIncoming: (caller: string) => void;
  setOutgoing: (receiver: string) => void;
}

export const CallContext = createContext<CallContextType | null>(null);
