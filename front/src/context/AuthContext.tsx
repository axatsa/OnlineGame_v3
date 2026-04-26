import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";

interface User {
    id: number;
    email: string;
    role: "super_admin" | "teacher" | "org_admin";
    full_name: string;
    onboarding_completed: boolean;
    organization_id: number | null;
    avatar_url?: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const handleUnauthorized = () => {
            console.warn("Unauthorized event received - logging out");
            logout();
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);

        const initAuth = async () => {
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                try {
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                    // Refresh user data from server so role/token changes are reflected without re-login
                    const res = await api.get("/auth/me");
                    const freshUser: User = res.data;
                    setUser(freshUser);
                    localStorage.setItem("user", JSON.stringify(freshUser));
                } catch (e) {
                    console.error("Auth init failed", e);
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        initAuth();

        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
        };
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        // Navigation should be handled by the component calling login, or by a useEffect in the router/app level
    };

    const logout = () => {
        localStorage.clear();
        queryClient.clear(); // Wipe React Query cache so next user never sees previous user's data
        setToken(null);
        setUser(null);
        navigate("/");
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
