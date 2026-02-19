import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Save, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
                    <button
                        onClick={() => navigate("/teacher")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-xl font-bold text-foreground font-serif">Profile Settings</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="space-y-8">

                    {/* User Info */}
                    <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground font-serif">{user?.full_name}</h2>
                            <p className="text-muted-foreground font-sans">{user?.email}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground uppercase">{user?.role}</span>
                        </div>
                    </div>

                    {/* Password Change Form */}
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
                                    placeholder="Enter current password"
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
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full rounded-xl font-sans"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Profile;
