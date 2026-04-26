import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ("super_admin" | "teacher" | "org_admin")[];
}

function roleHome(role: string): string {
    if (role === "super_admin") return "/admin";
    if (role === "org_admin") return "/org-admin";
    return "/teacher";
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
                navigate(roleHome(user.role));
            }
        }
    }, [user, token, isLoading, navigate, allowedRoles]);

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
    if (!user) return null; // Will redirect

    return <>{children}</>;
}
