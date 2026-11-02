import { useContext } from "react";
import { userContext } from "./userContextDef";

export const useUser = () => {
  const context = useContext(userContext);
  if (!context) {
    throw new Error("please use context inside the context provider block");
  }
  return context;
};
