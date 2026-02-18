import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ("super_admin" | "teacher")[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading) {
            if (!token || !user) {
                navigate("/");
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                // Redirect to their appropriate dashboard if they try to access wrong area
                if (user.role === "super_admin") navigate("/admin");
                else navigate("/teacher");
            }
        }
    }, [user, token, isLoading, navigate, allowedRoles]);

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!user) return null; // Will redirect

    return <>{children}</>;
}
