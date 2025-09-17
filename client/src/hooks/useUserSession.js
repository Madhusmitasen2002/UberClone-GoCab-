import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function useUserSession() {
  return useContext(UserContext);
}
