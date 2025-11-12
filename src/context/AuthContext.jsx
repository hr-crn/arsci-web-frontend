// src/context/AuthContext.jsx
import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem("user")) || null;
    if (savedUser) {
      const savedProfilePicture = localStorage.getItem("userProfilePicture");
      return {
        ...savedUser,
        profilePicture:
          savedUser.profilePicture ||
          savedUser.picture ||
          savedUser.photoURL ||
          savedUser.avatar ||
          savedProfilePicture ||
          null,
      };
    }
    return null;
  });

  const login = (token, userData) => {
    // Prefer Google-provided picture from backend over any previously saved local image
    const savedProfilePicture = localStorage.getItem("userProfilePicture");
    const preferredProfilePicture =
      userData?.profilePicture ||
      userData?.picture ||
      userData?.photoURL ||
      userData?.avatar ||
      savedProfilePicture ||
      null;

    const mergedUserData = {
      ...userData,
      profilePicture: preferredProfilePicture,
    };

    setToken(token);
    setUser(mergedUserData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(mergedUserData));
    if (preferredProfilePicture) {
      localStorage.setItem("userProfilePicture", preferredProfilePicture);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
