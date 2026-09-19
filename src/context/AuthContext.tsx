import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, registerUser } from "../services/api";
import { Navigate, useLocation } from "react-router-dom";
import { useI18n } from "./I18nContext";

export type AuthUser = {
  id: string;
  role: "Farmer" | "Buyer";
  name: string;
  identifier: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  signup: (role: "Farmer" | "Buyer", name: string, identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("fairtrade_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.error("Token verification failed:", err);
          localStorage.removeItem("fairtrade_token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  async function login(identifier: string, password: string) {
    const res = await loginUser({ identifier, password });
    localStorage.setItem("fairtrade_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  async function signup(role: "Farmer" | "Buyer", name: string, identifier: string, password: string) {
    const res = await registerUser({ role, name, identifier, password });
    localStorage.setItem("fairtrade_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    localStorage.removeItem("fairtrade_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function ProtectedRoute({ children, roleRequired }: { children: React.ReactNode; roleRequired?: "Farmer" | "Buyer" }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center">
        <div className="flex items-center gap-3 text-[#B96832] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B96832] border-t-transparent" />
          {t("auth.checking")}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    const redirectPath = user.role === "Farmer" ? "/farmer/dashboard" : "/buyer/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
