import React from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Users, Building2, BrainCircuit, DollarSign, Settings,
    LogOut
} from "lucide-react";
import { useLang } from "@/context/LangContext";

type Section = "dashboard" | "teachers" | "organizations" | "ai-monitor" | "finances" | "system";

interface AdminSidebarProps {
    activeSection: Section;
    setActiveSection: (section: Section) => void;
    setSidebarOpen: (open: boolean) => void;
    aiProvider: "gemini" | "openai";
    counts: {
        expiringTeachers: number;
        pendingPayments: number;
    };
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeSection,
    setActiveSection,
    setSidebarOpen,
    aiProvider,
    counts
}) => {
    const navigate = useNavigate();
    const { t } = useLang();

    const navItems: { icon: React.ElementType; label: string; section: Section; badge?: number }[] = [
        { icon: LayoutDashboard, label: "Дашборд", section: "dashboard" },
        { icon: Users, label: "Учителя", section: "teachers", badge: counts.expiringTeachers },
        { icon: Building2, label: "Организации", section: "organizations" },
        { icon: BrainCircuit, label: "AI Мониторинг", section: "ai-monitor" },
        { icon: DollarSign, label: "Финансы", section: "finances", badge: counts.pendingPayments },
        { icon: Settings, label: "Система", section: "system" },
    ];

    return (
        <div className="flex flex-col h-full bg-sidebar">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden">
                    <img src="/favicon.webp" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                    <span className="text-base font-bold text-sidebar-foreground font-serif block">ClassPlay</span>
                    <span className="text-xs text-sidebar-foreground/50 font-sans">{t("superAdmin")}</span>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto">
                {navItems.map((item) => (
                    <button
                        key={item.section}
                        onClick={() => { setActiveSection(item.section); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-colors ${activeSection === item.section
                            ? "bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`}
                    >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge ? (
                            <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {item.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-1">
                <div className="px-4 py-2 rounded-xl bg-sidebar-accent/50">
                    <p className="text-xs text-sidebar-foreground/40 font-sans">AI провайдер</p>
                    <p className="text-sm font-semibold text-sidebar-primary font-sans">{aiProvider === "gemini" ? "🟣 Gemini" : "🟢 OpenAI"}</p>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        navigate("/");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Выйти
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
