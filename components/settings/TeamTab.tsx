/**
 * @component TeamTab
 * @description Centralized user management panel.
 *
 * SuperAdmin view:
 *   - Creates users in ANY org (org picker dropdown)
 *   - Sees ALL users across ALL orgs with org badge + org filter
 *   - Can reassign users to different orgs
 *   - Can reactivate deactivated users
 *
 * Admin view:
 *   - Creates users in their own org (no org picker)
 *   - Sees only own-org users
 *
 * Features: password strength indicator, confirmation dialog,
 * lastLogin display, role color badges, inline search + org filter.
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    UserPlus, Pencil, UserX, UserCheck, Shield, Building2,
    Search, Clock, Eye, EyeOff, RefreshCw,
    Users, CheckCircle2, XCircle,
} from "lucide-react";
import { getPasswordStrength, getStrengthSegments } from "@/lib/utils/passwordStrength";
import { cn } from "@/lib/utils";
import {
    createUserForOrg, updateUser, deleteUser, reactivateUser, adminResetPassword,
} from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Org { _id: string; name: string; slug: string; active?: boolean; }
interface UserRecord {
    _id: string; orgId: string; orgName?: string | null; name: string;
    username: string; role: string; active: boolean;
    isSuperAdmin?: boolean; lastLogin?: string | null; createdAt?: string;
}

interface TeamTabProps {
    users: UserRecord[];
    allRoles: string[];
    isSuperAdmin?: boolean;
    organizations?: Org[];
    currentOrgId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    ADMIN:     { label: "Admin",     color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
    MARKETING: { label: "Marketing", color: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
    SALES:     { label: "Sales",     color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
};

// getPasswordStrength imported from @/lib/utils/passwordStrength

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null | undefined): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamTab({
    users: initialUsers,
    allRoles,
    isSuperAdmin = false,
    organizations = [],
    currentOrgId = "",
}: TeamTabProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [users, setUsers] = useState<UserRecord[]>(initialUsers);

    // ── Create form state
    const [form, setForm] = useState({
        name: "", username: "", password: "", role: "SALES",
        targetOrgId: currentOrgId,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // ── Edit dialog state
    const [editUser, setEditUser] = useState<UserRecord | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [resetPw, setResetPw] = useState("");
    const [showResetPw, setShowResetPw] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // ── Confirmation state
    const [confirmUser, setConfirmUser] = useState<UserRecord | null>(null);
    const [confirmAction, setConfirmAction] = useState<"deactivate" | "reactivate">("deactivate");

    // ── List filter state
    const [search, setSearch] = useState("");
    const [filterOrg, setFilterOrg] = useState("all");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("active");

    const pwStrength  = getPasswordStrength(form.password);
    const pwSegments  = getStrengthSegments(pwStrength.score, pwStrength.color);

    // ── Filtered users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
                !u.username.toLowerCase().includes(search.toLowerCase())) return false;
            if (filterOrg !== "all" && u.orgId !== filterOrg) return false;
            if (filterRole !== "all" && u.role !== filterRole) return false;
            if (filterStatus === "active" && !u.active) return false;
            if (filterStatus === "inactive" && u.active) return false;
            return true;
        });
    }, [users, search, filterOrg, filterRole, filterStatus]);

    // ── Create user
    const handleCreate = useCallback(async () => {
        if (!form.name || !form.username || !form.password) return;
        setIsCreating(true);
        const res = await createUserForOrg({
            name: form.name,
            username: form.username,
            password: form.password,
            role: form.role,
            targetOrgId: isSuperAdmin ? form.targetOrgId : undefined,
        });
        setIsCreating(false);
        if (res?.success) {
            toast({ title: "✅ User created", description: res.message });
            setForm({ name: "", username: "", password: "", role: "SALES", targetOrgId: currentOrgId });
            // ✅ Use real server refresh instead of optimistic fake _id
            router.refresh();
        } else {
            toast({ title: res?.message || "Error creating user", variant: "destructive" });
        }
    }, [form, isSuperAdmin, currentOrgId, organizations, toast]);

    // ── Open edit
    const openEdit = useCallback((user: UserRecord) => {
        setEditUser(user);
        setEditForm({ ...user, targetOrgId: user.orgId });
        setResetPw("");
    }, []);

    // ── Save edit
    const handleSave = useCallback(async () => {
        if (!editUser) return;
        setIsSaving(true);
        const res = await updateUser(editUser._id, {
            name: editForm.name,
            username: editForm.username,
            role: editForm.role,
            active: editForm.active,
            targetOrgId: isSuperAdmin ? editForm.targetOrgId : undefined,
        });
        setIsSaving(false);
        if (res?.success) {
            toast({ title: "✅ User updated" });
            setUsers(prev => prev.map(u => u._id === editUser._id
                ? { ...u, ...editForm, orgId: editForm.targetOrgId || u.orgId }
                : u));
            setEditUser(null);
        } else {
            toast({ title: res?.message || "Update failed", variant: "destructive" });
        }
    }, [editUser, editForm, isSuperAdmin, toast]);

    // ── Reset password
    const handleResetPw = useCallback(async () => {
        if (!editUser || resetPw.length < 6) return;
        setIsResetting(true);
        const res = await adminResetPassword(editUser._id, resetPw);
        setIsResetting(false);
        if (res?.success) {
            toast({ title: "✅ Password reset", description: res.message });
            setResetPw("");
        } else {
            toast({ title: res?.message || "Reset failed", variant: "destructive" });
        }
    }, [editUser, resetPw, toast]);

    // ── Confirm deactivate/reactivate
    const handleConfirmAction = useCallback(async () => {
        if (!confirmUser) return;
        const res = confirmAction === "deactivate"
            ? await deleteUser(confirmUser._id)
            : await reactivateUser(confirmUser._id);
        if (res?.success) {
            toast({ title: `✅ ${res.message}` });
            setUsers(prev => prev.map(u => u._id === confirmUser._id
                ? { ...u, active: confirmAction === "reactivate" }
                : u));
        } else {
            toast({ title: res?.message || "Action failed", variant: "destructive" });
        }
        setConfirmUser(null);
    }, [confirmUser, confirmAction, toast]);

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-5">
                {/* ── Create User Form ────────────────────────────────── */}
                <Card className="lg:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl self-start">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Create User
                        </CardTitle>
                        <CardDescription>
                            {isSuperAdmin ? "Add a user to any organization." : "Add a team member."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 bg-primary/5 p-5 rounded-2xl border border-primary/10">

                            {/* Org picker — SuperAdmin only */}
                            {isSuperAdmin && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3 w-3" /> Organization
                                    </Label>
                                    <Select
                                        value={form.targetOrgId}
                                        onValueChange={v => setForm(f => ({ ...f, targetOrgId: v }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                            <SelectValue placeholder="Select organization…" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl max-h-[200px]">
                                            {organizations.map(o => (
                                                <SelectItem key={o._id} value={o._id}>
                                                    <span className="flex items-center gap-2">
                                                        {o.name}
                                                        {!o.active && (
                                                            <Badge variant="outline" className="text-[9px] px-1 h-4 text-red-400 border-red-400/30">
                                                                Suspended
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Full name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Full Name</Label>
                                <Input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Jane Doe"
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>

                            {/* Username */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Username</Label>
                                <Input
                                    value={form.username}
                                    onChange={e => setForm(f => ({
                                        ...f,
                                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""),
                                    }))}
                                    placeholder="jane.doe"
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>

                            {/* Password + strength */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Password</Label>
                                <div className="relative">
                                    <Input
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="rounded-xl border-white/10 bg-black/20 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {form.password && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-1 flex-1 rounded-full transition-all duration-300",
                                                        i <= pwStrength.score
                                                            ? pwStrength.color
                                                            : "bg-white/10"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className={cn(
                                            "text-[10px] font-medium",
                                            pwStrength.score <= 1 ? "text-red-400" :
                                            pwStrength.score <= 2 ? "text-amber-400" :
                                            pwStrength.score <= 3 ? "text-blue-400" : "text-emerald-400"
                                        )}>
                                            {pwStrength.label} password
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Role</Label>
                                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="ADMIN">
                                            <span className="flex items-center gap-2">
                                                <Shield className="h-3.5 w-3.5 text-violet-400" /> Admin
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="MARKETING">Marketing</SelectItem>
                                        <SelectItem value="SALES">Sales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleCreate}
                                disabled={isCreating || !form.name || !form.username || form.password.length < 6 || (isSuperAdmin && !form.targetOrgId)}
                                className="w-full rounded-xl bg-primary hover:bg-primary/80 font-bold shadow-lg shadow-primary/20 transition-all"
                            >
                                {isCreating ? "Creating…" : "Create User"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Users List ──────────────────────────────────────── */}
                <Card className="lg:col-span-3 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">
                                    {isSuperAdmin ? "All Users" : "Team Members"}
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    {filteredUsers.length} of {users.length} users
                                </CardDescription>
                            </div>
                            <button
                                onClick={() => router.refresh()}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
                                title="Refresh user list"
                                aria-label="Refresh user list"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* ── Stats row ── */}
                        <div className="flex items-center gap-3 pt-1 flex-wrap">
                            {[
                                { icon: Users,         label: `${users.length} total`,                      cls: "text-muted-foreground" },
                                { icon: CheckCircle2,   label: `${users.filter(u => u.active).length} active`,  cls: "text-emerald-400" },
                                { icon: XCircle,        label: `${users.filter(u => !u.active).length} inactive`, cls: "text-red-400" },
                                { icon: Shield,         label: `${users.filter(u => u.role === 'ADMIN').length} admins`, cls: "text-violet-400" },
                            ].map(({ icon: Icon, label, cls }) => (
                                <div key={label} className={cn("flex items-center gap-1 text-[11px] font-medium", cls)}>
                                    <Icon className="h-3 w-3" />{label}
                                </div>
                            ))}
                        </div>

                        {/* Filter row */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[140px]">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search name or @username…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-8 h-8 text-xs rounded-xl border-white/10 bg-white/5"
                                />
                            </div>

                            {/* Org filter — SuperAdmin only */}
                            {isSuperAdmin && (
                                <Select value={filterOrg} onValueChange={setFilterOrg}>
                                    <SelectTrigger className="h-8 text-xs rounded-xl border-white/10 bg-white/5 w-[140px]">
                                        <Building2 className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                        <SelectValue placeholder="All orgs" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl max-h-[180px]">
                                        <SelectItem value="all">All Organizations</SelectItem>
                                        {organizations.map(o => (
                                            <SelectItem key={o._id} value={o._id}>{o.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Role filter */}
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="h-8 text-xs rounded-xl border-white/10 bg-white/5 w-[110px]">
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MARKETING">Marketing</SelectItem>
                                    <SelectItem value="SALES">Sales</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Status filter */}
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-8 text-xs rounded-xl border-white/10 bg-white/5 w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <UserX className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No users found</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-hide pr-1">
                                {filteredUsers.map(user => (
                                    <UserRow
                                        key={user._id}
                                        user={user}
                                        isSuperAdmin={isSuperAdmin}
                                        onEdit={openEdit}
                                        onDeactivate={u => { setConfirmUser(u); setConfirmAction("deactivate"); }}
                                        onReactivate={u => { setConfirmUser(u); setConfirmAction("reactivate"); }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Edit User Dialog ─────────────────────────────────────── */}
            <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" /> Edit User
                        </DialogTitle>
                        <DialogDescription>
                            Editing: <span className="font-mono text-primary">@{editUser?.username}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {editUser && (
                        <div className="space-y-4">
                            {/* Org reassignment — SuperAdmin only */}
                            {isSuperAdmin && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3 w-3" /> Organization
                                        <span className="text-amber-400 text-[10px]">(reassign)</span>
                                    </Label>
                                    <Select
                                        value={editForm.targetOrgId || editForm.orgId}
                                        onValueChange={v => setEditForm((f: any) => ({ ...f, targetOrgId: v }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl max-h-[180px]">
                                            {organizations.map(o => (
                                                <SelectItem key={o._id} value={o._id}>{o.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                                    <Input
                                        value={editForm.name || ""}
                                        onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                                        className="rounded-xl border-white/10 bg-black/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Username</Label>
                                    <Input
                                        value={editForm.username || ""}
                                        onChange={e => setEditForm((f: any) => ({
                                            ...f,
                                            username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""),
                                        }))}
                                        className="rounded-xl border-white/10 bg-black/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Role</Label>
                                <Select
                                    value={editForm.role}
                                    onValueChange={v => setEditForm((f: any) => ({ ...f, role: v }))}
                                >
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="ADMIN">
                                            <span className="flex items-center gap-2">
                                                <Shield className="h-3.5 w-3.5 text-violet-400" /> Admin
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="MARKETING">Marketing</SelectItem>
                                        <SelectItem value="SALES">Sales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <input
                                    type="checkbox"
                                    id="editActive"
                                    checked={editForm.active !== false}
                                    onChange={e => setEditForm((f: any) => ({ ...f, active: e.target.checked }))}
                                    className="w-4 h-4 accent-violet-500"
                                    aria-label="User active status"
                                />
                                <Label htmlFor="editActive" className="cursor-pointer">
                                    Account Active
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                        {editForm.active !== false ? "User can log in" : "Login disabled"}
                                    </span>
                                </Label>
                            </div>

                            {/* Password reset */}
                            <div className="border-t border-white/10 pt-4 space-y-2">
                                <Label className="text-xs text-muted-foreground">Reset Password</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showResetPw ? "text" : "password"}
                                            value={resetPw}
                                            onChange={e => setResetPw(e.target.value)}
                                            placeholder="New password (min 6)"
                                            className="rounded-xl border-white/10 bg-black/20 pr-9"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowResetPw(v => !v)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label="Toggle password visibility"
                                        >
                                            {showResetPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                        disabled={resetPw.length < 6 || isResetting}
                                        onClick={handleResetPw}
                                    >
                                        {isResetting ? "…" : "Reset"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUser(null)} className="rounded-xl border-white/10">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl bg-primary">
                            {isSaving ? "Saving…" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Confirm Deactivate/Reactivate Dialog ────────────────── */}
            <AlertDialog open={!!confirmUser} onOpenChange={open => !open && setConfirmUser(null)}>
                <AlertDialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction === "deactivate" ? "Deactivate User?" : "Reactivate User?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction === "deactivate"
                                ? `"${confirmUser?.name}" will lose access immediately. Their data and history are preserved.`
                                : `"${confirmUser?.name}" will be able to log in again.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={cn(
                                "rounded-xl",
                                confirmAction === "deactivate"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                            )}
                        >
                            {confirmAction === "deactivate" ? "Deactivate" : "Reactivate"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── UserRow sub-component ────────────────────────────────────────────────────

function UserRow({
    user, isSuperAdmin, onEdit, onDeactivate, onReactivate,
}: {
    user: UserRecord;
    isSuperAdmin: boolean;
    onEdit: (u: UserRecord) => void;
    onDeactivate: (u: UserRecord) => void;
    onReactivate: (u: UserRecord) => void;
}) {
    const roleConfig = ROLE_CONFIG[user.role] || { label: user.role, color: "bg-white/10 text-white/70 border-white/20" };
    const initials = user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-2xl border transition-all group",
            user.active
                ? "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                : "border-red-500/10 bg-red-500/5 opacity-60 hover:opacity-80"
        )}>
            {/* Avatar */}
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border",
                user.active
                    ? "bg-primary/15 text-primary border-primary/20"
                    : "bg-red-500/15 text-red-400 border-red-500/20"
            )}>
                {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate">{user.name}</span>
                    {!user.active && (
                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 text-red-400 border-red-400/30">
                            Inactive
                        </Badge>
                    )}
                    {user.isSuperAdmin && (
                        <Badge variant="outline" className="text-[9px] px-1.5 h-4 text-amber-400 border-amber-400/30">
                            SuperAdmin
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
                {isSuperAdmin && user.orgName && (
                    <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-2.5 w-2.5" />{user.orgName}
                    </div>
                )}
            </div>

            {/* Meta */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 h-5 border uppercase tracking-wide", roleConfig.color)}>
                    {roleConfig.label}
                </Badge>
                {user.lastLogin && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(user.lastLogin)}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                >
                    <Pencil className="h-3 w-3" />
                </Button>
                {user.active ? (
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => onDeactivate(user)}
                        title="Deactivate"
                    >
                        <UserX className="h-3 w-3" />
                    </Button>
                ) : (
                    <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400"
                        onClick={() => onReactivate(user)}
                        title="Reactivate"
                    >
                        <UserCheck className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}
