import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

interface User {
    id: number;
    email: string;
    role: "super_admin" | "teacher";
    full_name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                try {
                    // Verify token or decoding it
                    // Ideally call /api/auth/me to get fresh user data
                    // For now, we trust the stored token or decode if we stored user data separately
                    // But better: let's rely on the login response we just implemented.
                    // If we refresh, we lose "user" object if we don't store it.
                    // Let's store user in localStorage for persistence or fetch it.
                    const storedUser = localStorage.getItem("user");
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (e) {
                    console.error("Auth init failed", e);
                    localStorage.removeItem("token");
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        // Navigation should be handled by the component calling login, or by a useEffect in the router/app level
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
