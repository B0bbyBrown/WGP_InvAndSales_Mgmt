import { createContext } from "react";
import { User } from "@shared/schema";

export interface AuthContextType {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});
