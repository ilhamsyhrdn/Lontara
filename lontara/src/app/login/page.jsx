"use client";

import Image from "next/image";
import { User, Lock, AlertCircle, Loader2 } from "lucide-react";
import Button from "../components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, error: authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/main-dashboard");
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      setError("Username and password are required.");
      return;
    }

    setIsSubmitting(true);

    const result = await login(formData);

    if (!result.success) {
      setError(result.error || "Login failed. Please check your credentials.");
      setIsSubmitting(false);
      return;
    }

    router.push("/main-dashboard");
  };

  return (
    <div
      style={{ backgroundImage: "url('/background.svg')" }}
      className="w-full h-screen flex justify-center items-center"
    >
      <div className="w-full max-w-md h-screen flex flex-col justify-center items-center bg-white m-4 gap-5">
        <Image
          src="/logo_lontara.svg"
          width={200}
          height={300}
          alt="Lontara Logo"
        />

        <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-xs">
          {(error || authError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              <span>{error || authError}</span>
            </div>
          )}

          <div className="relative mb-4">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="pl-10 w-full border-b rounded-lg px-3 py-2 text-black/60 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="relative mb-4">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              className="pl-10 w-full border-b rounded-lg px-3 py-2 text-black/60 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
              required
            />
            <span
              onClick={() => !isSubmitting && setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 text-sm"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <Button
            type="submit"
            className="mt-4 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
              
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
