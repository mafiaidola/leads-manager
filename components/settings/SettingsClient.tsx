"use client";

import { useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateSettings, updateBranding, updateGoals, updateTheme } from "@/lib/actions/settings";
import { changePassword } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";
import { X, Shield, Key, Save, Check, Database, HardDrive, FileDown, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import WhatsAppConnectCard from "@/components/whatsapp/WhatsAppConnectCard";

// Extracted tab components
import { GeneralTab } from "./GeneralTab";
import { ProductsTab } from "./ProductsTab";
import { TeamTab } from "./TeamTab";
import { BrandingTab } from "./BrandingTab";

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

    const handleSaveSettings = useCallback(async () => {
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
    }, [statuses, sources, products, customFields, customRoles, toast]);

    const handleAddStatus = useCallback(() => {
        setStatuses(prev => [...prev, { key: "new_status", label: "New Status", color: "#8b5cf6" }]);
    }, []);

    const handleRemoveStatus = useCallback((index: number) => {
        setStatuses(prev => {
            const newStatuses = [...prev];
            newStatuses.splice(index, 1);
            return newStatuses;
        });
    }, []);

    const handleStatusChange = useCallback((index: number, field: string, value: string) => {
        setStatuses(prev => {
            const newStatuses = [...prev];
            const updated: any = { ...newStatuses[index], [field]: value };
            if (field === 'label') {
                updated.key = value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            }
            newStatuses[index] = updated;
            return newStatuses;
        });
    }, []);

    const handleChangePassword = useCallback(async () => {
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
    }, [passwordForm, toast]);

    const handleSaveBranding = useCallback(async () => {
        const result = await updateBranding(branding);
        if (result?.success) {
            toast({ title: "Branding updated" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    }, [branding, toast]);

    const handleSaveGoals = useCallback(async () => {
        const result = await updateGoals(goals);
        if (result?.success) {
            toast({ title: "Goals updated" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    }, [goals, toast]);

    const handleBackup = useCallback(() => {
        window.location.href = "/api/backup";
    }, []);

    const handleChangeTheme = useCallback(async (theme: "violet" | "ocean" | "emerald") => {
        setCurrentTheme(theme);
        setTheme(theme);
        const result = await updateTheme(theme);
        if (result?.success) {
            toast({ title: `Theme changed to ${theme === "violet" ? "Violet Noir" : theme === "ocean" ? "Ocean Blue" : "Emerald Forest"}` });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    }, [setTheme, toast]);

    // Roles
    const builtinRoles = ["ADMIN", "MARKETING", "SALES"];
    const allRoles = useMemo(() => [...builtinRoles, ...customRoles.map((r: any) => r.name)], [customRoles]);

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-card/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl h-auto flex-wrap">
                <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">General</TabsTrigger>
                <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Products</TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Team</TabsTrigger>
                <TabsTrigger value="branding" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Branding</TabsTrigger>
                <TabsTrigger value="roles" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Roles</TabsTrigger>
                <TabsTrigger value="account" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Account</TabsTrigger>
                <TabsTrigger value="system" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">System</TabsTrigger>
                <TabsTrigger value="whatsapp" className="rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all">WhatsApp</TabsTrigger>
            </TabsList>

            {/* ── General Tab ─────────────────────────────── */}
            <TabsContent value="general">
                <GeneralTab
                    statuses={statuses}
                    sources={sources}
                    goals={goals}
                    onStatusChange={handleStatusChange}
                    onAddStatus={handleAddStatus}
                    onRemoveStatus={handleRemoveStatus}
                    onSourcesChange={setSources}
                    onGoalsChange={setGoals}
                    onSaveSettings={handleSaveSettings}
                    onSaveGoals={handleSaveGoals}
                />
            </TabsContent>

            {/* ── Products Tab ────────────────────────────── */}
            <TabsContent value="products">
                <ProductsTab
                    products={products}
                    customFields={customFields}
                    onProductsChange={setProducts}
                    onCustomFieldsChange={setCustomFields}
                    onSaveSettings={handleSaveSettings}
                />
            </TabsContent>

            {/* ── Team Tab ─────────────────────────────────── */}
            <TabsContent value="users">
                <TeamTab users={users} allRoles={allRoles} />
            </TabsContent>

            {/* ── Branding Tab ─────────────────────────────── */}
            <TabsContent value="branding">
                <BrandingTab
                    branding={branding}
                    currentTheme={currentTheme}
                    onBrandingChange={setBranding}
                    onSaveBranding={handleSaveBranding}
                    onChangeTheme={handleChangeTheme}
                    onBackup={handleBackup}
                />
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

            {/* ── System Tab ────────────────────────────────── */}
            <TabsContent value="system">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Backup */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-500" />
                                Database Backup
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Download a full JSON backup of all leads, users, settings, notes, and actions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                <p className="text-xs text-blue-400 font-medium mb-1">📦 Includes:</p>
                                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                                    <li>All leads and their data</li>
                                    <li>Team members and roles</li>
                                    <li>Notes and action history</li>
                                    <li>Application settings</li>
                                </ul>
                            </div>
                            <Button onClick={handleBackup} className="rounded-xl bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20 gap-2">
                                <HardDrive className="h-4 w-4" />
                                Download Backup (JSON)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Export All Leads */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileDown className="h-5 w-5 text-emerald-500" />
                                Export All Leads
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Download all active leads as a CSV file (26 fields including contact, deal, and address data).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-emerald-400 font-medium mb-1">📊 CSV includes:</p>
                                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                                    <li>Name, phone, email, company</li>
                                    <li>Status, source, product, value</li>
                                    <li>Address, city, country, tags</li>
                                    <li>Assigned agent, created date</li>
                                </ul>
                            </div>
                            <Button
                                onClick={() => { window.location.href = "/api/leads/export"; }}
                                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export All Leads (CSV)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* ── WhatsApp Tab ─────────────────────────────── */}
            <TabsContent value="whatsapp">
                <div className="grid gap-6 md:grid-cols-2">
                    <WhatsAppConnectCard />
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-green-500 rounded-full" />
                                How It Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>1️⃣ Click <strong>Connect WhatsApp</strong> to link your Meta Business account</p>
                            <p>2️⃣ Authorize the app to access your WhatsApp Business API</p>
                            <p>3️⃣ Go to any lead with a phone number and click the <strong>WhatsApp</strong> button</p>
                            <p>4️⃣ Send free-text messages (within 24h window) or pre-approved templates</p>
                            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-xs text-amber-400 font-medium">⚠️ Requirements</p>
                                <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                                    <li>Meta Business account with WhatsApp Business API</li>
                                    <li>Facebook App with whatsapp_business_messaging scope</li>
                                    <li>Phone number registered in WhatsApp Business Manager</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}
