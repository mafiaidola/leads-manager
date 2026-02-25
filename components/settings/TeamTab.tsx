"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createUser, updateUser, deleteUser, adminResetPassword } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";

interface TeamTabProps {
    users: any[];
    allRoles: string[];
}

export function TeamTab({ users, allRoles }: TeamTabProps) {
    const { toast } = useToast();
    const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "SALES" });
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [resetPassword, setResetPassword] = useState("");

    const handleCreateUser = async () => {
        const formData = new FormData();
        formData.append("name", newUser.name);
        formData.append("username", newUser.username);
        formData.append("password", newUser.password);
        formData.append("role", newUser.role);

        const result = await createUser(null, formData);
        if (result?.success) {
            toast({ title: "User created", description: `${newUser.role} user created successfully.` });
            setNewUser({ name: "", username: "", password: "", role: "SALES" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        const result = await updateUser(editingUser._id, {
            name: editingUser.name,
            username: editingUser.username,
            role: editingUser.role,
            active: editingUser.active,
        });
        if (result?.success) {
            toast({ title: "User updated" });
            setIsEditOpen(false);
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const result = await deleteUser(userId);
        if (result?.success) {
            toast({ title: "User deactivated" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-5">
                <Card className="md:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-violet-500" />
                            Create User
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Add new team members.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">Full Name</Label>
                                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="rounded-xl border-white/10 bg-black/20" placeholder="Jane Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">Username</Label>
                                <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })} className="rounded-xl border-white/10 bg-black/20" placeholder="jane.doe" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">Initial Password</Label>
                                <Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} type="password" className="rounded-xl border-white/10 bg-black/20" placeholder="••••••••" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">Role</Label>
                                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        {allRoles.map(r => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreateUser} disabled={!newUser.name || !newUser.username || !newUser.password}
                                className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 transition-all font-bold">
                                Register Team Member
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Team Members</CardTitle>
                        <CardDescription>Manage access and roles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {users.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold border",
                                            user.active !== false ? "bg-violet-500/20 text-violet-500 border-violet-500/10" : "bg-red-500/20 text-red-400 border-red-500/10"
                                        )}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                {user.name}
                                                {user.active === false && <Badge variant="outline" className="text-[8px] px-1 py-0 text-red-400 border-red-400/30">Inactive</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground">@{user.username || user.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className={cn(
                                            "rounded-full text-[10px] font-bold border-white/10 uppercase tracking-widest px-2 h-6",
                                            user.role === 'ADMIN' ? 'bg-violet-500/15 text-violet-500 border-violet-500/30'
                                                : user.role === 'MARKETING' ? 'bg-teal-500/15 text-teal-500 border-teal-500/30'
                                                    : 'bg-primary/15 text-primary border-primary/30'
                                        )}>
                                            {user.role}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setEditingUser({ ...user }); setIsEditOpen(true); }}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteUser(user._id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user details and role.</DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="rounded-xl border-white/10 bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input value={editingUser.username || ""} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })} className="rounded-xl border-white/10 bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        {allRoles.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="userActive" checked={editingUser.active !== false} onChange={(e) => setEditingUser({ ...editingUser, active: e.target.checked })} aria-label="User active status" />
                                <Label htmlFor="userActive">Active</Label>
                            </div>
                            <div className="border-t border-white/10 pt-4 mt-2 space-y-2">
                                <Label className="text-xs text-muted-foreground">Reset Password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        value={resetPassword}
                                        onChange={(e) => setResetPassword(e.target.value)}
                                        placeholder="New password (min 6 chars)"
                                        className="rounded-xl border-white/10 bg-black/20 flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                        disabled={resetPassword.length < 6}
                                        onClick={async () => {
                                            const res = await adminResetPassword(editingUser._id, resetPassword);
                                            if (res?.success) {
                                                toast({ title: res.message });
                                                setResetPassword("");
                                            } else {
                                                toast({ title: res?.message || "Error", variant: "destructive" });
                                            }
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleUpdateUser} className="rounded-xl bg-primary">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
