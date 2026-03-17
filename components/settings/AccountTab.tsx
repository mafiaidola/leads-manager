/**
 * @component AccountTab
 * @description Personal account settings tab: profile info card,
 * self-service password change with strength indicator.
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, User, Building2, Shield, Eye, EyeOff, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { changePassword } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";
import { getPasswordStrength, getStrengthSegments } from "@/lib/utils/passwordStrength";

interface AccountTabProps {
    currentUser: {
        name: string;
        username: string;
        role: string;
        orgName?: string;
        isSuperAdmin?: boolean;
        lastLogin?: string | null;
        createdAt?: string;
    };
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    ADMIN:     { label: "Admin",     color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
    MARKETING: { label: "Marketing", color: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
    SALES:     { label: "Sales",     color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "Unknown";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function relativeTime(iso: string | null | undefined): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "Just now";
    if (m < 60) return `${m} minutes ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hours ago`;
    return `${Math.floor(h / 24)} days ago`;
}

export function AccountTab({ currentUser }: AccountTabProps) {
    const { toast } = useToast();
    const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [showOld, setShowOld]   = useState(false);
    const [showNew, setShowNew]   = useState(false);
    const [showConf, setShowConf] = useState(false);
    const [saving, setSaving]     = useState(false);

    const pwStrength = getPasswordStrength(form.newPassword);
    const segments   = getStrengthSegments(pwStrength.score, pwStrength.color);
    const roleConfig = ROLE_CONFIG[currentUser.role] || { label: currentUser.role, color: "bg-white/10 text-white border-white/20" };

    const initials = currentUser.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

    const handleSave = async () => {
        if (form.newPassword !== form.confirmPassword) {
            toast({ title: "Passwords don't match", variant: "destructive" });
            return;
        }
        if (form.newPassword.length < 6) {
            toast({ title: "Password too short", variant: "destructive" });
            return;
        }
        setSaving(true);
        const res = await changePassword(form.oldPassword, form.newPassword);
        setSaving(false);
        if (res?.success) {
            toast({ title: "✅ Password changed successfully" });
            setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } else {
            toast({ title: res?.message || "Failed to change password", variant: "destructive" });
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">

            {/* ── Profile Card ──────────────────────────────────────── */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Profile
                    </CardTitle>
                    <CardDescription>Your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                            {initials}
                        </div>
                        <div>
                            <div className="text-xl font-bold">{currentUser.name}</div>
                            <div className="text-sm text-muted-foreground">@{currentUser.username}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide h-5 px-2 border", roleConfig.color)}>
                                    {roleConfig.label}
                                </Badge>
                                {currentUser.isSuperAdmin && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-2 text-amber-400 border-amber-400/30 bg-amber-500/10">
                                        <Shield className="h-3 w-3 mr-1" /> SuperAdmin
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details grid */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                        {currentUser.orgName && (
                            <div className="flex items-center gap-3 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Organization</div>
                                    <div className="font-medium">{currentUser.orgName}</div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Member Since</div>
                                <div className="font-medium">{formatDate(currentUser.createdAt)}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Key className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                                <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Last Login</div>
                                <div className={cn("font-medium", currentUser.lastLogin ? "text-emerald-400" : "text-muted-foreground")}>
                                    {relativeTime(currentUser.lastLogin)}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Change Password ────────────────────────────────────── */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Key className="h-5 w-5 text-orange-400" />
                        Change Password
                    </CardTitle>
                    <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Current password */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Current Password</Label>
                        <div className="relative">
                            <Input
                                type={showOld ? "text" : "password"}
                                value={form.oldPassword}
                                onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
                                className="rounded-xl border-white/10 bg-black/20 pr-10"
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowOld(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle old password visibility">
                                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New password + strength */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">New Password</Label>
                        <div className="relative">
                            <Input
                                type={showNew ? "text" : "password"}
                                value={form.newPassword}
                                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                                className="rounded-xl border-white/10 bg-black/20 pr-10"
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowNew(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle new password visibility">
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {form.newPassword && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {segments.map((cls, i) => (
                                        <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", cls)} />
                                    ))}
                                </div>
                                <p className={cn("text-[10px] font-medium", pwStrength.textColor)}>
                                    {pwStrength.label} password
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                type={showConf ? "text" : "password"}
                                value={form.confirmPassword}
                                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                className={cn(
                                    "rounded-xl border-white/10 bg-black/20 pr-10",
                                    form.confirmPassword && form.newPassword !== form.confirmPassword
                                        ? "border-red-500/40"
                                        : form.confirmPassword && form.newPassword === form.confirmPassword
                                            ? "border-emerald-500/40"
                                            : ""
                                )}
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowConf(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Toggle confirm password visibility">
                                {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                            <p className="text-[10px] text-red-400">Passwords don&apos;t match</p>
                        )}
                        {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword && (
                            <p className="text-[10px] text-emerald-400">Passwords match ✓</p>
                        )}
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={
                            saving ||
                            !form.oldPassword ||
                            !form.newPassword ||
                            form.newPassword !== form.confirmPassword ||
                            form.newPassword.length < 6
                        }
                        className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 font-bold"
                    >
                        <Key className="h-4 w-4 mr-2" />
                        {saving ? "Saving…" : "Update Password"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
