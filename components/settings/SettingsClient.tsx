"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateSettings, updateBranding, updateGoals, updateTheme } from "@/lib/actions/settings";
import { createUser, updateUser, deleteUser, changePassword, adminResetPassword } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X, Pencil, Trash2, Download, Shield, Palette, Key, Target, Save, UserPlus, Check, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useTheme } from "@/components/ThemeProvider";

const ALL_PERMISSIONS = [
    { key: "view_leads", label: "View Leads" },
    { key: "create_leads", label: "Create Leads" },
    { key: "edit_leads", label: "Edit Leads" },
    { key: "delete_leads", label: "Delete Leads" },
    { key: "view_reports", label: "View Reports" },
    { key: "manage_settings", label: "Manage Settings" },
    { key: "manage_users", label: "Manage Users" },
    { key: "export_data", label: "Export Data" },
];

export function SettingsClient({ settings, users }: { settings: any, users: any[] }) {
    const [statuses, setStatuses] = useState<any[]>(settings?.statuses || []);
    const [sources, setSources] = useState<any[]>(settings?.sources || []);
    const [products, setProducts] = useState<any[]>(settings?.products || []);
    const { toast } = useToast();

    // Branding state
    const [branding, setBranding] = useState({
        appName: settings?.branding?.appName || "Leads Mgr",
        accentColor: settings?.branding?.accentColor || "#8b5cf6",
        logoUrl: settings?.branding?.logoUrl || "",
    });

    // Goals state
    const [goals, setGoals] = useState({
        monthlyLeadTarget: settings?.goals?.monthlyLeadTarget || 50,
        monthlyConversionTarget: settings?.goals?.monthlyConversionTarget || 10,
    });

    // Theme state
    const [currentTheme, setCurrentTheme] = useState<"violet" | "ocean" | "emerald">(settings?.theme || "violet");
    const { setTheme } = useTheme();

    // Custom Roles state
    const [customRoles, setCustomRoles] = useState<any[]>(settings?.customRoles || []);

    // Custom Fields state
    const [customFields, setCustomFields] = useState<any[]>(settings?.customFields || []);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

    // User edit state
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleSaveSettings = async () => {
        const result = await updateSettings({
            statuses,
            sources,
            products,
            customFields,
            customRoles,
        });
        if (result?.message === "Settings updated") {
            toast({ title: "Settings saved" });
        } else {
            toast({ title: "Error saving settings", variant: "destructive" });
        }
    };

    const handleAddStatus = () => {
        setStatuses([...statuses, { key: `status_${Date.now()}`, label: "New Status", color: "gray" }]);
    }

    const handleRemoveStatus = (index: number) => {
        const newStatuses = [...statuses];
        newStatuses.splice(index, 1);
        setStatuses(newStatuses);
    }

    const handleStatusChange = (index: number, field: string, value: string) => {
        const newStatuses = [...statuses];
        newStatuses[index] = { ...newStatuses[index], [field]: value };
        setStatuses(newStatuses);
    }

    // User creation state
    const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "SALES" });
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
    }

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

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({ title: "Passwords don't match", variant: "destructive" });
            return;
        }
        const result = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
        if (result?.success) {
            toast({ title: "Password changed successfully" });
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    const handleSaveBranding = async () => {
        const result = await updateBranding(branding);
        if (result?.success) {
            toast({ title: "Branding updated" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    const handleSaveGoals = async () => {
        const result = await updateGoals(goals);
        if (result?.success) {
            toast({ title: "Goals updated" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    const handleBackup = () => {
        window.location.href = "/api/backup";
    };

    const handleChangeTheme = async (theme: "violet" | "ocean" | "emerald") => {
        setCurrentTheme(theme);
        setTheme(theme);
        const result = await updateTheme(theme);
        if (result?.success) {
            toast({ title: `Theme changed to ${theme === "violet" ? "Violet Noir" : theme === "ocean" ? "Ocean Blue" : "Emerald Forest"}` });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    };

    // Roles
    const builtinRoles = ["ADMIN", "MARKETING", "SALES"];
    const allRoles = [...builtinRoles, ...customRoles.map((r: any) => r.name)];

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-card/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl h-auto flex-wrap">
                <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">General</TabsTrigger>
                <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Products</TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Team</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Branding</TabsTrigger>
                <TabsTrigger value="roles" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Roles</TabsTrigger>
                <TabsTrigger value="account" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Account</TabsTrigger>
            </TabsList>

            {/* ── General Tab ─────────────────────────────── */}
            <TabsContent value="general">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-primary rounded-full" />
                                Lead Statuses
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Configure possible lead stages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {statuses.map((status, index) => (
                                    <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Label</Label>
                                            <Input
                                                value={status.label}
                                                onChange={(e) => handleStatusChange(index, 'label', e.target.value)}
                                                placeholder="Label"
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Color</Label>
                                            <Input
                                                type="color"
                                                value={status.color}
                                                onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                                                className="h-9 p-1 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStatus(index)} className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity mt-5">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleAddStatus} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-primary/10 hover:text-primary transition-colors">
                                Add New Status
                            </Button>
                            <div className="pt-6 border-t border-white/5">
                                <Button onClick={handleSaveSettings} className="rounded-xl bg-primary hover:bg-primary/80 px-8 shadow-lg shadow-primary/20">Save Status Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                                Lead Sources
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Where your leads come from.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {sources.map((source, index) => (
                                    <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex-1">
                                            <Input
                                                value={source.label}
                                                onChange={(e) => {
                                                    const newSources = [...sources];
                                                    newSources[index] = { ...source, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                                    setSources(newSources);
                                                }}
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newSources = [...sources];
                                            newSources.splice(index, 1);
                                            setSources(newSources);
                                        }} className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => setSources([...sources, { key: `source_${Date.now()}`, label: "New Source" }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                                Add New Source
                            </Button>
                            <div className="pt-6 border-t border-white/5">
                                <Button onClick={handleSaveSettings} className="rounded-xl bg-blue-500 hover:bg-blue-600 px-8 shadow-lg shadow-blue-500/20">Save Source Changes</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Goals */}
                    <Card className="md:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Target className="h-5 w-5 text-amber-500" />
                                Monthly Goals
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Set targets for the Reports &quot;Goal vs Actual&quot; chart.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs ml-1">Monthly Lead Target</Label>
                                    <Input type="number" value={goals.monthlyLeadTarget} onChange={(e) => setGoals({ ...goals, monthlyLeadTarget: Number(e.target.value) })} className="rounded-xl border-white/10 bg-black/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs ml-1">Monthly Conversion Target</Label>
                                    <Input type="number" value={goals.monthlyConversionTarget} onChange={(e) => setGoals({ ...goals, monthlyConversionTarget: Number(e.target.value) })} className="rounded-xl border-white/10 bg-black/20" />
                                </div>
                            </div>
                            <div className="pt-6">
                                <Button onClick={handleSaveGoals} className="rounded-xl bg-amber-500 hover:bg-amber-600 px-8 shadow-lg shadow-amber-500/20">
                                    <Save className="h-4 w-4 mr-2" />Save Goals
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── Products Tab ────────────────────────────── */}
            <TabsContent value="products">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            Products / Services
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Manage the offerings your leads are interested in.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {products.map((product, index) => (
                                <div key={index} className="flex items-center gap-2 group bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex-1">
                                        <Input
                                            value={product.label}
                                            onChange={(e) => {
                                                const newProducts = [...products];
                                                newProducts[index] = { ...product, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                                setProducts(newProducts);
                                            }}
                                            className="h-9 rounded-xl border-white/10 bg-black/20"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newProducts = [...products];
                                        newProducts.splice(index, 1);
                                        setProducts(newProducts);
                                    }} className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setProducts([...products, { key: `product_${Date.now()}`, label: "New Product" }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                            Add New Product
                        </Button>
                        <div className="pt-6 border-t border-white/5 flex gap-3">
                            <Button onClick={handleSaveSettings} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-8 shadow-lg shadow-emerald-500/20">Save Product Changes</Button>
                        </div>

                        {/* Custom Fields */}
                        <div className="pt-6 border-t border-white/5">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><span className="w-1.5 h-4 bg-cyan-500 rounded-full" />Custom Lead Fields</h3>
                            <div className="space-y-3">
                                {customFields.map((field, index) => (
                                    <div key={index} className="flex items-center gap-2 group bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <Input
                                            value={field.label}
                                            onChange={(e) => {
                                                const newFields = [...customFields];
                                                newFields[index] = { ...field, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                                setCustomFields(newFields);
                                            }}
                                            placeholder="Field name"
                                            className="h-9 flex-1 rounded-xl border-white/10 bg-black/20"
                                        />
                                        <Select value={field.type} onValueChange={(v) => {
                                            const newFields = [...customFields];
                                            newFields[index] = { ...field, type: v };
                                            setCustomFields(newFields);
                                        }}>
                                            <SelectTrigger className="w-28 h-9 rounded-xl border-white/10 bg-black/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="select">Select</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newFields = [...customFields];
                                            newFields.splice(index, 1);
                                            setCustomFields(newFields);
                                        }} className="h-9 w-9 text-red-400">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => setCustomFields([...customFields, { key: `cf_${Date.now()}`, label: "", type: "text" }])} variant="outline" size="sm" className="mt-3 rounded-xl border-white/10 hover:bg-cyan-500/10 hover:text-cyan-500 transition-colors">
                                Add Custom Field
                            </Button>
                            <div className="pt-4">
                                <Button onClick={handleSaveSettings} className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-8 shadow-lg shadow-cyan-500/20">Save Fields</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── Team Tab ─────────────────────────────────── */}
            <TabsContent value="users">
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
            </TabsContent>

            {/* ── Branding Tab ─────────────────────────────── */}
            <TabsContent value="branding">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Palette className="h-5 w-5 text-pink-500" />
                                App Branding
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Customize your CRM&apos;s appearance.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">App Name</Label>
                                <Input value={branding.appName} onChange={(e) => setBranding({ ...branding, appName: e.target.value })} className="rounded-xl border-white/10 bg-black/20" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">Accent Color</Label>
                                <div className="flex gap-3 items-center">
                                    <Input type="color" value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })} className="h-10 w-16 p-1 rounded-xl border-white/10 bg-black/20" />
                                    <Input value={branding.accentColor} onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })} className="rounded-xl border-white/10 bg-black/20 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">Logo URL (optional)</Label>
                                <Input value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} placeholder="https://..." className="rounded-xl border-white/10 bg-black/20" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                                <div className="flex items-center gap-3">
                                    {/* eslint-disable-next-line react/forbid-dom-props */}
                                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold branding-preview" style={{ backgroundColor: branding.accentColor }} aria-hidden="true">
                                        {branding.appName.charAt(0)}
                                    </div>
                                    <span className="font-bold">{branding.appName}</span>
                                </div>
                            </div>
                            <Button onClick={handleSaveBranding} className="rounded-xl bg-pink-500 hover:bg-pink-600 px-8 shadow-lg shadow-pink-500/20">
                                <Save className="h-4 w-4 mr-2" />Save Branding
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Theme Picker */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                App Theme
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Choose a theme for all users. This applies globally across the entire application.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                {/* Violet Noir */}
                                <button
                                    onClick={() => handleChangeTheme("violet")}
                                    className={cn(
                                        "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02]",
                                        currentTheme === "violet" ? "border-violet-500 shadow-lg shadow-violet-500/25" : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="rounded-xl overflow-hidden">
                                        <div className="h-24 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 relative">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                                            <div className="absolute bottom-2 left-3 flex gap-1">
                                                <div className="h-2 w-8 bg-white/40 rounded-full" />
                                                <div className="h-2 w-5 bg-white/25 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-card/80">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold">Violet Noir</p>
                                                    <p className="text-[10px] text-muted-foreground">Premium & Modern</p>
                                                </div>
                                                {currentTheme === "violet" && (
                                                    <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Ocean Blue */}
                                <button
                                    onClick={() => handleChangeTheme("ocean")}
                                    className={cn(
                                        "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02]",
                                        currentTheme === "ocean" ? "border-blue-500 shadow-lg shadow-blue-500/25" : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="rounded-xl overflow-hidden">
                                        <div className="h-24 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 relative">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                                            <div className="absolute bottom-2 left-3 flex gap-1">
                                                <div className="h-2 w-8 bg-white/40 rounded-full" />
                                                <div className="h-2 w-5 bg-white/25 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-card/80">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold">Ocean Blue</p>
                                                    <p className="text-[10px] text-muted-foreground">Corporate & Clean</p>
                                                </div>
                                                {currentTheme === "ocean" && (
                                                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Emerald Forest */}
                                <button
                                    onClick={() => handleChangeTheme("emerald")}
                                    className={cn(
                                        "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02]",
                                        currentTheme === "emerald" ? "border-emerald-500 shadow-lg shadow-emerald-500/25" : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <div className="rounded-xl overflow-hidden">
                                        <div className="h-24 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 relative">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                                            <div className="absolute bottom-2 left-3 flex gap-1">
                                                <div className="h-2 w-8 bg-white/40 rounded-full" />
                                                <div className="h-2 w-5 bg-white/25 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="p-3 bg-card/80">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold">Emerald Forest</p>
                                                    <p className="text-[10px] text-muted-foreground">Fresh & Natural</p>
                                                </div>
                                                {currentTheme === "emerald" && (
                                                    <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                        <Check className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Management - separated as full width */}
                <div className="mt-6">
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Download className="h-5 w-5 text-green-500" />
                                Data Management
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Export and backup your data.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10">
                                <h3 className="font-bold text-sm mb-2">Full Backup</h3>
                                <p className="text-xs text-muted-foreground mb-4">Download all leads, users, settings, notes, and actions as a JSON file.</p>
                                <Button onClick={handleBackup} className="rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20">
                                    <Download className="h-4 w-4 mr-2" />Download Backup (.json)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── Roles Tab ────────────────────────────────── */}
            <TabsContent value="roles">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-500" />
                            Custom Roles
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Create custom roles with specific permissions. Built-in roles (Admin, Marketing, Sales) cannot be removed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Built-in roles */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Built-in Roles</h3>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {builtinRoles.map(role => (
                                    <div key={role} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="font-bold text-sm mb-2">{role}</div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {role === 'ADMIN' ? 'Full access to everything' : role === 'MARKETING' ? 'Create, edit, assign leads' : 'View & manage assigned leads'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom roles */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Roles</h3>
                            {customRoles.map((role, index) => (
                                <div key={index} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Input value={role.name} onChange={(e) => {
                                            const newRoles = [...customRoles];
                                            newRoles[index] = { ...role, name: e.target.value.toUpperCase().replace(/\s/g, '_') };
                                            setCustomRoles(newRoles);
                                        }} placeholder="ROLE_NAME" className="h-9 flex-1 rounded-xl border-white/10 bg-black/20 font-mono" />
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newRoles = [...customRoles];
                                            newRoles.splice(index, 1);
                                            setCustomRoles(newRoles);
                                        }} className="h-9 w-9 text-red-400"><X className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {ALL_PERMISSIONS.map(perm => (
                                            <label key={perm.key} className={cn(
                                                "flex items-center gap-1.5 text-xs p-2 rounded-xl border cursor-pointer transition-colors",
                                                role.permissions?.includes(perm.key) ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "border-white/5 text-muted-foreground hover:bg-white/5"
                                            )}>
                                                <input type="checkbox" className="sr-only" checked={role.permissions?.includes(perm.key) || false} onChange={(e) => {
                                                    const newRoles = [...customRoles];
                                                    const perms = new Set(role.permissions || []);
                                                    if (e.target.checked) perms.add(perm.key); else perms.delete(perm.key);
                                                    newRoles[index] = { ...role, permissions: Array.from(perms) };
                                                    setCustomRoles(newRoles);
                                                }} />
                                                {role.permissions?.includes(perm.key) && <Check className="h-3 w-3" />}
                                                {perm.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button onClick={() => setCustomRoles([...customRoles, { name: "NEW_ROLE", permissions: ["view_leads"] }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors">
                                Add Custom Role
                            </Button>
                            <div className="pt-4">
                                <Button onClick={handleSaveSettings} className="rounded-xl bg-indigo-500 hover:bg-indigo-600 px-8 shadow-lg shadow-indigo-500/20">
                                    <Save className="h-4 w-4 mr-2" />Save Roles
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ── Account Tab ──────────────────────────────── */}
            <TabsContent value="account">
                <Card className="max-w-lg rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Key className="h-5 w-5 text-orange-500" />
                            Change Password
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Update your account password.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">Current Password</Label>
                            <Input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className="rounded-xl border-white/10 bg-black/20" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">New Password</Label>
                            <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="rounded-xl border-white/10 bg-black/20" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">Confirm New Password</Label>
                            <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="rounded-xl border-white/10 bg-black/20" placeholder="••••••••" />
                        </div>
                        {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                            <p className="text-xs text-red-400">Passwords don&apos;t match</p>
                        )}
                        <Button onClick={handleChangePassword}
                            disabled={!passwordForm.oldPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                            className="rounded-xl bg-orange-500 hover:bg-orange-600 px-8 shadow-lg shadow-orange-500/20">
                            <Key className="h-4 w-4 mr-2" />Update Password
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs >
    );
}
