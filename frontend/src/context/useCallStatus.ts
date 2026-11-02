import { useContext } from "react";
import { CallContext } from "./callContextDef";

export const useCallStatus = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("please use context inside the context provider block");
  }
  return context;
};
