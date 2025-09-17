import { createContext, useState, useEffect, useCallback } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem("userSession");
    const storedOnline = localStorage.getItem("onlineStatus");
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setSession(parsedSession);
        
        // Set online status based on stored value or default to false
        if (storedOnline !== null) {
          setOnline(storedOnline === "true");
        } else {
          setOnline(parsedSession.user?.user_metadata?.is_online || false);
        }
      } catch (error) {
        console.error("Error parsing stored session:", error);
        localStorage.removeItem("userSession");
        localStorage.removeItem("onlineStatus");
      }
    }
  }, []);

  const saveSession = useCallback((data) => {
    setSession(data);
    localStorage.setItem("userSession", JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setOnline(false);
    localStorage.removeItem("userSession");
    localStorage.removeItem("onlineStatus");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
  }, []);

  const toggleOnline = useCallback(() => {
    if (!session?.user?.id) return;
    
    const newStatus = !online;
    setOnline(newStatus);
    localStorage.setItem("onlineStatus", newStatus.toString());
    
    // Update server with new status
    updateOnlineStatusOnServer(newStatus, session.user.id);
  }, [online, session]);

  const updateOnlineStatusOnServer = async (isOnline, userId) => {
    try {
      let lat = null;
      let lng = null;
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            sendUpdateToServer(isOnline, lat, lng, userId);
          },
          () => sendUpdateToServer(isOnline, null, null, userId)
        );
      } else {
        sendUpdateToServer(isOnline, null, null, userId);
      }
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  };

  const sendUpdateToServer = async (isOnline, lat, lng, userId) => {
    try {
      await fetch(`http://localhost:5000/api/users/${userId}/online`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: isOnline, lat, lng }),
      });
    } catch (error) {
      console.error("Error sending update to server:", error);
    }
  };

  return (
    <UserContext.Provider value={{ 
      session, 
      online, 
      saveSession, 
      logout, 
      toggleOnline 
    }}>
      {children}
    </UserContext.Provider>
  );
};