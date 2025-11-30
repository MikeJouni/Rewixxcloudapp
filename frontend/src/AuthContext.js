import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Hydrate from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem("auth_token");
    const storedEmail = localStorage.getItem("auth_email");
    const storedName = localStorage.getItem("auth_name");
    const storedAvatar = localStorage.getItem("auth_avatar");
    if (stored) {
      setToken(stored);
      if (storedEmail) setEmail(storedEmail);
      if (storedName) setName(storedName);
      if (storedAvatar) setAvatarUrl(storedAvatar);
    }
  }, []);

  const login = (jwt, userEmail, remember, displayName, avatar) => {
    // Clear all cached data FIRST, before setting new token
    if (window.queryClient) {
      window.queryClient.clear();
      window.queryClient.removeQueries();
    }
    
    // Clear token first to ensure any components check for auth status
    setToken(null);
    setEmail(null);
    setName(null);
    setAvatarUrl(null);
    
    // Use requestAnimationFrame to ensure state updates happen after cache clear
    requestAnimationFrame(() => {
      setToken(jwt);
      setEmail(userEmail);
      setName(displayName || null);
      setAvatarUrl(avatar || null);
      
      if (remember) {
        localStorage.setItem("auth_token", jwt);
        localStorage.setItem("auth_email", userEmail || "");
        localStorage.setItem("auth_name", displayName || "");
        localStorage.setItem("auth_avatar", avatar || "");
      } else {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("auth_name");
        localStorage.removeItem("auth_avatar");
      }
    });
  };

  const logout = () => {
    // Clear all cached data on logout
    if (window.queryClient) {
      window.queryClient.clear();
    }
    
    setToken(null);
    setEmail(null);
    setName(null);
    setAvatarUrl(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("auth_name");
    localStorage.removeItem("auth_avatar");
  };

  return (
    <AuthContext.Provider value={{ token, email, name, avatarUrl, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


