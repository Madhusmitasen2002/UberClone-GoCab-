// client/src/context/UserContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem("userSession");
    const storedOnline = localStorage.getItem("onlineStatus");
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
        setOnline(storedOnline ? storedOnline === "true" : parsed.user?.user_metadata?.is_online || false);
      } catch {
        localStorage.removeItem("userSession");
        localStorage.removeItem("onlineStatus");
      }
    }
  }, []);

  const saveSession = useCallback((data) => {
    setSession(data);
    localStorage.setItem("userSession", JSON.stringify(data));
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setSession(null);
    setOnline(false);
    localStorage.clear();
  }, []);

  const toggleOnline = useCallback(() => {
    if (!session?.user?.id) return;
    const newStatus = !online;
    setOnline(newStatus);
    localStorage.setItem("onlineStatus", newStatus.toString());
    updateOnlineStatusOnServer(newStatus, session.user.id);
  }, [online, session]);

  const updateOnlineStatusOnServer = async (isOnline, userId) => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => sendUpdateToServer(isOnline, pos.coords.latitude, pos.coords.longitude, userId),
          () => sendUpdateToServer(isOnline, null, null, userId)
        );
      } else sendUpdateToServer(isOnline, null, null, userId);
    } catch (err) { console.error(err); }
  };

  const sendUpdateToServer = async (isOnline, lat, lng, userId) => {
    try { await api.updateDriverStatus(userId, { is_online: isOnline, lat, lng }); } 
    catch (err) { console.error(err); }
  };

  return (
    <UserContext.Provider value={{ session, online, saveSession, logout, toggleOnline }}>
      {children}
    </UserContext.Provider>
  );
};
