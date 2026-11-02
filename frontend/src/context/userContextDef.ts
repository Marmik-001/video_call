import { createContext } from "react";

export interface UserContextType {
  currentUser: string;
  setCurrentUser: (name: string) => void;
  currentUsernameRef: React.RefObject<string>;
}

export const userContext = createContext<UserContextType | null>(null);
