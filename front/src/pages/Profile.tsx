import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Save, Loader2, User, LogOut, FileText, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Saved Resources
    const [resources, setResources] = useState<any[]>([]);
    const [loadingRes, setLoadingRes] = useState(true);
    const [viewRes, setViewRes] = useState<any | null>(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await api.get("/resources/");
            setResources(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingRes(false);
        }
    };

    const deleteResource = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/resources/${id}`);
            toast.success("Resource deleted");
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !oldPassword) {
            toast.error("Please fill in both fields");
            return;
        }

        setIsLoading(true);
        try {
            await api.put("/auth/change-password", {
                old_password: oldPassword,
                new_password: newPassword
            });
            toast.success("Password updated successfully!");
            setOldPassword("");
            setNewPassword("");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/teacher")}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-xl font-bold text-foreground font-serif">Profile</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Left Column: User Info & Actions */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center text-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground font-serif">{user?.full_name}</h2>
                                <p className="text-muted-foreground font-sans mb-2">{user?.email}</p>
                                <span className="px-3 py-1 rounded-full bg-muted text-xs font-mono text-muted-foreground uppercase">{user?.role}</span>
                            </div>
                            <Button variant="destructive" className="w-full mt-4 rounded-xl" onClick={logout}>
                                <LogOut className="w-4 h-4 mr-2" /> Logout
                            </Button>
                        </div>

                        {/* Password Form */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Lock className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold text-foreground font-serif">Change Password</h3>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="old-pass">Current Password</Label>
                                    <Input
                                        id="old-pass"
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="rounded-xl"
                                        placeholder="••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-pass">New Password</Label>
                                    <Input
                                        id="new-pass"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="rounded-xl"
                                        placeholder="••••••"
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full rounded-xl">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Update Password
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Saved Resources */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-card rounded-2xl border border-border p-6 min-h-[500px]">
                            <div className="flex items-center gap-2 mb-6">
                                <FileText className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold text-foreground font-serif">Saved Resources</h3>
                            </div>

                            {loadingRes ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : resources.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    No saved resources yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {resources.map(res => (
                                        <div key={res.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-foreground truncate">{res.title}</h4>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{res.type} • {new Date(res.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setViewRes(res)}>
                                                    View
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteResource(res.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* View Resource Modal */}
            <Dialog open={!!viewRes} onOpenChange={(open) => !open && setViewRes(null)}>
                {viewRes && (
                    <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="font-bold text-lg">{viewRes.title}</h3>
                                    <p className="text-xs text-muted-foreground uppercase">{viewRes.type}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
                                        <Printer className="w-4 h-4" /> Print
                                    </Button>
                                    <Button variant="ghost" onClick={() => setViewRes(null)}>Close</Button>
                                </div>
                            </div>
                            <div className="p-8 overflow-y-auto bg-white flex-1 print:p-0">
                                {/* Render content based on type */}
                                <div className="print-content">
                                    {(() => {
                                        try {
                                            const content = JSON.parse(viewRes.content);
                                            if (viewRes.type === "math" && content.problems) {
                                                return (
                                                    <div className="space-y-4 font-mono text-sm max-w-lg mx-auto">
                                                        <h2 className="text-center font-serif text-xl font-bold mb-6 underline decoration-2 decoration-gray-200 underline-offset-4">{viewRes.title}</h2>
                                                        {content.problems.map((p: string, i: number) => (
                                                            <div key={i} className="pb-2 border-b border-gray-100">{p}</div>
                                                        ))}
                                                    </div>
                                                );
                                            } else if (viewRes.type === "crossword" && content.grid) {
                                                return (
                                                    <div className="flex flex-col items-center">
                                                        <h2 className="text-center font-serif text-xl font-bold mb-6">{viewRes.title}</h2>
                                                        <div className="inline-grid gap-px bg-gray-900 border-2 border-gray-900 p-px mb-8"
                                                            style={{
                                                                gridTemplateColumns: `repeat(${content.width}, 1.5rem)`,
                                                                gridTemplateRows: `repeat(${content.height}, 1.5rem)`
                                                            }}>
                                                            {content.grid.map((row: any[], r: number) =>
                                                                row.map((cell, c) => {
                                                                    const wordStart = content.words.find((w: any) => w.row === r && w.col === c);
                                                                    return (
                                                                        <div key={`${r}-${c}`} className={`w-6 h-6 relative flex items-center justify-center text-xs font-bold ${cell ? "bg-white" : "bg-gray-300"}`}>
                                                                            {cell && wordStart && (
                                                                                <span className="absolute top-0.5 left-0.5 text-[6px] leading-none">{wordStart.number}</span>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-8 text-xs font-sans w-full max-w-lg">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 mb-2 uppercase">Across</h4>
                                                                <ul className="space-y-1 list-none">
                                                                    {content.words.filter((w: any) => w.isAcross).sort((a: any, b: any) => a.number - b.number).map((w: any) => (
                                                                        <li key={w.word}><span className="font-bold">{w.number}.</span> {w.clue}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 mb-2 uppercase">Down</h4>
                                                                <ul className="space-y-1 list-none">
                                                                    {content.words.filter((w: any) => !w.isAcross).sort((a: any, b: any) => a.number - b.number).map((w: any) => (
                                                                        <li key={w.word}><span className="font-bold">{w.number}.</span> {w.clue}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            return <p className="text-destructive">Error parsing content</p>;
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                        <style>{`
                           @media print {
                               body * { visibility: hidden; }
                               .print-content, .print-content * { visibility: visible; }
                               .print-content { position: absolute; left: 0; top: 0; width: 100%; height: 100%; padding: 40px; margin: 0; }
                           }
                       `}</style>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default Profile;
