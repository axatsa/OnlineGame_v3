import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, ChevronDown, Check, Plus, Globe, User, LogOut, Bell
} from "lucide-react";
import { useClass } from "@/context/ClassContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

interface TeacherNavbarProps {
    activeNav?: string;
}

const TeacherNavbar: React.FC<TeacherNavbarProps> = ({ activeNav: initialActiveNav }) => {
    const navigate = useNavigate();
    const { classes, activeClass, setActiveClassId } = useClass();
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const { user, logout } = useAuth();

    const [showClassPicker, setShowClassPicker] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [activeNav, setActiveNav] = useState(initialActiveNav || "Generators");
    const [scrolled, setScrolled] = useState(false);
    const [announcement, setAnnouncement] = useState<{ text: string; enabled: boolean } | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);

        const fetchAnnouncement = async () => {
            try {
                const res = await api.get("/auth/announcement");
                if (res.data.enabled) {
                    setAnnouncement(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch announcement", e);
            }
        };
        fetchAnnouncement();

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navPills = [
        { key: "Generators", label: t("navGenerators"), route: "/generator" },
        { key: "Tools", label: t("navTools"), route: "/tools" },
        { key: "Games", label: t("navGames"), route: "/games" },
        { key: "Library", label: t("navLibrary"), route: "/library" },
    ] as const;

    return (
        <>
            {/* Global Announcement Banner */}
            <AnimatePresence>
                {announcement && announcement.enabled && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white relative z-40"
                    >
                        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-xs sm:text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-emerald-100" />
                                <span>{announcement.text}</span>
                            </div>
                            <button 
                                onClick={() => setAnnouncement(null)}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className={`sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}>
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo + Brand */}
                <button
                    onClick={() => navigate("/teacher")}
                    className="flex items-center gap-3 group"
                >
                    <img
                        src="/logo_sticker.webp"
                        alt="ClassPlay Logo"
                        className="w-10 h-10 rounded-xl object-contain group-hover:scale-110 transition-transform duration-200"
                    />
                    <span className="text-xl font-display font-bold text-foreground hidden sm:inline tracking-tight">
                        ClassPlay
                    </span>
                </button>

                {/* Nav Pills */}
                <div className="flex items-center bg-muted rounded-full p-1 mx-4">
                    {navPills.map((pill) => (
                        <button
                            key={pill.key}
                            onClick={() => {
                                setActiveNav(pill.key);
                                navigate(pill.route);
                            }}
                            className={`relative px-5 py-2 text-sm font-medium font-sans rounded-full transition-colors ${activeNav === pill.key ? "text-white" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {activeNav === pill.key && (
                                <motion.div
                                    layoutId="activePill"
                                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{pill.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right: Class Picker + Lang + Profile */}
                <div className="flex items-center gap-2">
                    {/* Class Picker */}
                    <div className="relative mr-2">
                        <button
                            onClick={() => setShowClassPicker(v => !v)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-sans font-medium"
                        >
                            <GraduationCap className="w-4 h-4 text-emerald-500" />
                            {activeClass ? (
                                <span className="max-w-[100px] truncate">{activeClass.name}</span>
                            ) : (
                                <span className="text-muted-foreground">{t("selectClass")}</span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showClassPicker ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                            {showClassPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    className="absolute right-0 top-12 bg-card border border-border rounded-2xl shadow-xl p-1.5 min-w-[200px] z-50 flex flex-col gap-1"
                                >
                                    {classes.map((cls) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left text-sm font-sans"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{cls.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{cls.studentCount} {t("studentsLabel")}</span>
                                            </div>
                                            {cls.id === activeClass?.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                        </button>
                                    ))}
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 font-semibold font-sans hover:bg-muted rounded-xl transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> {t("addClass")}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Language Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-sans font-medium text-foreground"
                        >
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            {lang === "ru" ? "RU" : "UZ"}
                        </button>
                        <AnimatePresence>
                            {showLangMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-0 top-10 bg-card border border-border rounded-2xl shadow-xl p-1.5 min-w-[130px] z-50"
                                >
                                    {(["ru", "uz"] as const).map(l => (
                                        <button
                                            key={l}
                                            onClick={() => { i18n.changeLanguage(l); setShowLangMenu(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-sans transition-colors flex items-center gap-2 ${lang === l ? "bg-emerald-50 text-emerald-700 font-semibold" : "hover:bg-muted text-foreground"}`}
                                        >
                                            {l === "ru" ? "🇷🇺 Русский" : "🇺🇿 O'zbekcha"}
                                            {lang === l && <Check className="w-3.5 h-3.5 ml-auto" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile */}
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                        title={t("view_profile", "Профиль")}
                    >
                        <User className="w-5 h-5 text-white" />
                    </button>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm"
                        title={t("logout", "Выйти")}
                    >
                        <LogOut className="w-5 h-5 text-red-500" />
                    </button>
                </div>
            </div>
        </header>
        </>
    );
};

export default TeacherNavbar;


