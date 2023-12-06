import { Dispatch, SetStateAction, createContext } from "react";
import { UserRole } from "./types";

export type UserContextValue = {
  userRole: UserRole;
  setUserRole: Dispatch<SetStateAction<UserRole>>;
};

export const userContextDefault: UserContextValue = {
  userRole: UserRole.UNDEFINED,
  setUserRole: () => {},
};

export const UserContext = createContext(userContextDefault);
