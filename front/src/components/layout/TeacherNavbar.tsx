import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, ChevronDown, Check, Plus, Globe, User
} from "lucide-react";
import { useClass } from "@/context/ClassContext";
import { useLang, Lang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";

interface TeacherNavbarProps {
    activeNav?: string;
}

const TeacherNavbar: React.FC<TeacherNavbarProps> = ({ activeNav: initialActiveNav }) => {
    const navigate = useNavigate();
    const { classes, activeClass, setActiveClassId } = useClass();
    const { lang, setLang, t } = useLang();
    const { user } = useAuth();

    const [showClassPicker, setShowClassPicker] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [activeNav, setActiveNav] = useState(initialActiveNav || "Generators");

    const navPills = [
        { key: "Generators", label: t("navGenerators"), route: "/generator" },
        { key: "Tools", label: t("navTools"), route: "/tools" },
        { key: "Games", label: t("navGames"), route: "/games" },
        { key: "Library", label: t("navLibrary"), route: "/library" },
    ] as const;

    return (
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/logo-t.png" alt="ClassPlay Logo" className="w-12 h-12 rounded-lg object-contain" />
                    <span className="text-xl font-bold font-serif text-foreground hidden sm:inline">ClassPlay</span>
                </div>

                {/* Nav Pills */}
                <div className="flex items-center bg-muted rounded-full p-1 mx-4">
                    {navPills.map((pill) => (
                        <button
                            key={pill.key}
                            onClick={() => {
                                setActiveNav(pill.key);
                                navigate(pill.route);
                            }}
                            className={`relative px-5 py-2 text-sm font-medium font-sans rounded-full transition-colors ${activeNav === pill.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {activeNav === pill.key && (
                                <motion.div
                                    layoutId="activePill"
                                    className="absolute inset-0 bg-primary rounded-full"
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
                            <GraduationCap className="w-4 h-4 text-primary" />
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
                                    className="absolute right-0 top-12 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[200px] z-50 flex flex-col gap-1"
                                >
                                    {classes.map((cls) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => { setActiveClassId(cls.id); setShowClassPicker(false); }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left text-sm font-sans"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{cls.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{cls.studentCount} {t("studentsLabel")}</span>
                                            </div>
                                            {cls.id === activeClass?.id && <Check className="w-3.5 h-3.5 text-primary" />}
                                        </button>
                                    ))}
                                    <div className="h-px bg-border my-1" />
                                    <button
                                        onClick={() => { setShowClassPicker(false); navigate("/classes"); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary font-semibold font-sans hover:bg-muted rounded-lg transition-colors"
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
                                    className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[130px] z-50"
                                >
                                    {(["ru", "uz"] as Lang[]).map(l => (
                                        <button
                                            key={l}
                                            onClick={() => { setLang(l); setShowLangMenu(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-sans transition-colors flex items-center gap-2 ${lang === l ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"}`}
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
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                        <User className="w-5 h-5 text-primary" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TeacherNavbar;
