/**
 * @component SettingsClient
 * @description Main settings page client component with tabbed sections.
 * URL-hash navigation: ?tab=xxx persists active tab across refreshes.
 */
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSettings, updateBranding, updateGoals, updateTheme, updateNotificationPrefs } from "@/lib/actions/settings";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save, Check, Database, HardDrive, FileDown, Download, X, Bell } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import WhatsAppConnectCard from "@/components/whatsapp/WhatsAppConnectCard";
import dynamic from "next/dynamic";

// Static imports
import { GeneralTab } from "./GeneralTab";
import { ProductsTab } from "./ProductsTab";
import { AccountTab } from "./AccountTab";

// Dynamic imports (loaded on demand)
const TeamTab       = dynamic(() => import("./TeamTab").then(m => ({ default: m.TeamTab })), { ssr: false });
const BrandingTab   = dynamic(() => import("./BrandingTab").then(m => ({ default: m.BrandingTab })), { ssr: false });
const SecurityTab   = dynamic(() => import("./SecurityTab").then(m => ({ default: m.SecurityTab })), { ssr: false });
const OrganizationsTab = dynamic(() => import("./OrganizationsTab").then(m => ({ default: m.OrganizationsTab })), { ssr: false });

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

export function SettingsClient({
    settings, users, isSuperAdmin, organizations, currentOrgId, securityStats, currentUser,
}: {
    settings: any;
    users: any[];
    isSuperAdmin?: boolean;
    organizations?: any[];
    currentOrgId?: string;
    securityStats?: { users: any[]; recentEvents: any[] };
    currentUser?: any;
}) {
    const router        = useRouter();
    const searchParams  = useSearchParams();

    // ── URL-persisted tab ────────────────────────────────────────
    const defaultTab = searchParams.get("tab") || "general";
    const handleTabChange = useCallback((value: string) => {
        router.replace(`?tab=${value}`, { scroll: false });
    }, [router]);

    const [statuses, setStatuses] = useState<any[]>(settings?.statuses || []);
    const [sources, setSources]   = useState<any[]>(settings?.sources || []);
    const [products, setProducts] = useState<any[]>(settings?.products || []);
    const { toast } = useToast();

    // Notification preferences
    const [notifPrefs, setNotifPrefs] = useState({
        onNewLead:      settings?.notifPrefs?.onNewLead      ?? true,
        onAssigned:     settings?.notifPrefs?.onAssigned     ?? true,
        onStatusChange: settings?.notifPrefs?.onStatusChange ?? false,
    });

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

    // Export state
    const [exportOrgId, setExportOrgId]    = useState<string>("all");
    const [exportFormat, setExportFormat]  = useState<"csv" | "excel" | "word">("csv");
    const { setTheme } = useTheme();

    // Custom Roles state
    const [customRoles, setCustomRoles] = useState<any[]>(settings?.customRoles || []);

    // Custom Fields state
    const [customFields, setCustomFields] = useState<any[]>(settings?.customFields || []);

    // Password change state (kept for legacy, AccountTab manages its own)

    const handleSaveSettings = useCallback(async () => {
        const result = await updateSettings({
            statuses,
            sources,
            products,
            customFields,
            customRoles,
        });
        if (result?.success) {
            toast({ title: "Settings saved" });
        } else {
            toast({ title: result?.error || "Error saving settings", variant: "destructive" });
        }
    }, [statuses, sources, products, customFields, customRoles, toast]);

    // ✅ Drag-reorder callback for GeneralTab statuses
    const handleReorderStatuses = useCallback((reordered: any[]) => {
        setStatuses(reordered);
    }, []);

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


    const handleSaveBranding = useCallback(async () => {
        const result = await updateBranding(branding);
        if (result?.success) {
            toast({ title: result?.message || "Branding updated" });
        } else {
            toast({ title: result?.error || result?.message || "Error saving branding", variant: "destructive" });
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
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-card/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl h-auto flex overflow-x-auto scrollbar-hide gap-1">
                <TabsTrigger value="general"       className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">General</TabsTrigger>
                <TabsTrigger value="products"      className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Products</TabsTrigger>
                <TabsTrigger value="users"         className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Team</TabsTrigger>
                <TabsTrigger value="branding"      className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Branding</TabsTrigger>
                <TabsTrigger value="roles"         className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Roles</TabsTrigger>
                <TabsTrigger value="account"       className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Account</TabsTrigger>
                <TabsTrigger value="system"        className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">System</TabsTrigger>
                <TabsTrigger value="whatsapp"      className="rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all">WhatsApp</TabsTrigger>
                {isSuperAdmin && (
                    <TabsTrigger value="security"  className="rounded-xl data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all">
                        🔐 Security
                    </TabsTrigger>
                )}
                {isSuperAdmin && (
                    <TabsTrigger value="organizations" className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">Organizations</TabsTrigger>
                )}
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
                    onReorderStatuses={handleReorderStatuses}
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
                <TeamTab
                    users={users}
                    allRoles={allRoles}
                    isSuperAdmin={isSuperAdmin}
                    organizations={organizations as any[] || []}
                    currentOrgId={currentOrgId || ""}
                />
            </TabsContent>

            {/* ── Branding Tab ─────────────────────────────── */}
            <TabsContent value="branding">
                <BrandingTab
                    branding={branding}
                    currentTheme={currentTheme}
                    onBrandingChange={setBranding}
                    onSaveBranding={handleSaveBranding}
                    onChangeTheme={handleChangeTheme}
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
                <div className="space-y-6">
                    <AccountTab currentUser={currentUser || {
                        name: "Current User",
                        username: "user",
                        role: "ADMIN",
                        isSuperAdmin,
                    }} />

                    {/* Notification preferences */}
                    <Card className="max-w-3xl rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-400" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>Choose which events send you in-app notifications.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {([
                                { key: "onNewLead",      label: "New lead created",              desc: "Notify me whenever a new lead is added" },
                                { key: "onAssigned",     label: "Lead assigned to me",           desc: "Notify me when I am assigned to a lead" },
                                { key: "onStatusChange", label: "Lead status changes",           desc: "Notify me on every status update" },
                            ] as const).map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div>
                                        <div className="text-sm font-medium">{label}</div>
                                        <div className="text-xs text-muted-foreground">{desc}</div>
                                    </div>
                                    <Switch
                                        checked={notifPrefs[key]}
                                        onCheckedChange={(v: boolean) => setNotifPrefs(prev => ({ ...prev, [key]: v }))}
                                    />
                                </div>
                            ))}
                            <Button
                                onClick={async () => {
                                    const res = await updateNotificationPrefs(notifPrefs);
                                    if (res?.success) toast({ title: "✅ Preferences saved" });
                                    else toast({ title: res?.error || "Error", variant: "destructive" });
                                }}
                                className="rounded-xl bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                            >
                                <Save className="h-4 w-4 mr-2" /> Save Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </div>
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

                            {/* Restore Section */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restore from Backup</p>
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-xs text-amber-400">⚠️ Restoring will merge backup data into your current organization. Existing data will not be deleted.</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".json"
                                    title="Select backup file"
                                    className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-400 file:rounded-lg hover:file:bg-amber-500/20 file:cursor-pointer cursor-pointer"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const text = await file.text();
                                            const backupData = JSON.parse(text);
                                            if (!backupData?._meta?.version) {
                                                toast({ title: "Invalid backup file", description: "Missing metadata", variant: "destructive" });
                                                return;
                                            }
                                            // Import settings from backup
                                            const orgSettings = backupData.organization?.settings;
                                            if (orgSettings) {
                                                if (orgSettings.statuses) setStatuses(orgSettings.statuses);
                                                if (orgSettings.sources) setSources(orgSettings.sources);
                                                if (orgSettings.products) setProducts(orgSettings.products);
                                                if (orgSettings.customFields) setCustomFields(orgSettings.customFields);
                                                if (orgSettings.goals) setGoals(orgSettings.goals);
                                            }
                                            const orgBranding = backupData.organization?.branding;
                                            if (orgBranding) {
                                                setBranding(orgBranding);
                                            }
                                            toast({ title: "✅ Backup loaded", description: `Loaded ${backupData._stats?.leads || 0} leads, ${backupData._stats?.users || 0} users. Click Save to apply settings.` });
                                        } catch (err) {
                                            toast({ title: "Failed to read backup", description: "Invalid JSON file", variant: "destructive" });
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </div>
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
                                Download all active leads in your preferred format (22 fields including contact, deal, and address data).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-emerald-400 font-medium mb-1">📊 Export includes:</p>
                                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                                    <li>Name, phone, email, company</li>
                                    <li>Status, source, product, value</li>
                                    <li>Address, city, country, tags</li>
                                    <li>Assigned agent, created date</li>
                                </ul>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {isSuperAdmin && organizations && organizations.length > 0 && (
                                    <Select value={exportOrgId} onValueChange={setExportOrgId}>
                                        <SelectTrigger className="w-44 rounded-xl border-white/10 bg-black/20">
                                            <SelectValue placeholder="All Organizations" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                            <SelectItem value="all">All Organizations</SelectItem>
                                            {organizations.map((o: any) => (
                                                <SelectItem key={o._id} value={o._id}>{o.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Select value={exportFormat} onValueChange={(v: "csv" | "excel" | "word") => setExportFormat(v)}>
                                    <SelectTrigger className="w-36 rounded-xl border-white/10 bg-black/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                        <SelectItem value="word">Word (.docx)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => {
                                        const orgParam = isSuperAdmin && exportOrgId !== "all" ? `&orgId=${exportOrgId}` : "";
                                        window.location.href = `/api/leads/export?format=${exportFormat}${orgParam}`;
                                    }}
                                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export All Leads
                                </Button>
                            </div>
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

            {/* ── Security Tab (SuperAdmin only) ────────────── */}
            {isSuperAdmin && (
                <TabsContent value="security">
                    <SecurityTab
                        users={securityStats?.users || []}
                        recentEvents={securityStats?.recentEvents || []}
                    />
                </TabsContent>
            )}

            {/* ── Organizations Tab (SuperAdmin only) ──────── */}
            {isSuperAdmin && (
                <TabsContent value="organizations">
                    <OrganizationsTab orgs={organizations || []} currentOrgId={currentOrgId} />
                </TabsContent>
            )}
        </Tabs>
    );
}
