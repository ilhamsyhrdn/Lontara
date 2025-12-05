"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await apiClient.get("/auth/me");
          setUser(response.data);
        } catch (err) {
          localStorage.removeItem("token");
        }
      }
      setLoadingInit(false);
    };
    checkUserSession();
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      const response = await apiClient.post("/auth/login", credentials);
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      setUser(userData);

      console.log("✅ Token saved:", localStorage.getItem("token"));

      return { success: true, user: userData };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "An unexpected error occurred.";
      setError(errorMessage);
      console.error("Login Failed:", err);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    router.push("/login");
  };

  const authContextValue = {
    user,
    loading: loadingInit, // 🔹 kalau masih mau dipakai di tempat lain
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isStaff: user?.role === "STAFF",
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loadingInit && children} {/* 🔹 HANYA init yang nge-block render */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
