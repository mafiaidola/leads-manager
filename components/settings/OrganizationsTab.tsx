/**
 * @component OrganizationsTab
 * @description SuperAdmin settings tab for multi-tenant org management.
 * Features: create, suspend, reactivate, clone, hard-delete, switch orgs.
 */
"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Building2, Plus, Pencil, Trash2, Users, Globe, Check, X, Loader2,
    Mail, Phone, Info, Palette, UserPlus, Target, BarChart3, Calendar,
    ChevronDown, ChevronUp, Shield, Eye, Package, Download, Upload, Database,
    Copy, Ban, Power, Crown, UserX, ToggleLeft, ToggleRight,
    FileSpreadsheet, FileText, FileDown, ImagePlus, Trash
} from "lucide-react";
import {
    createOrganization, updateOrganization, deleteOrganization, hardDeleteOrganization,
    updateOrganizationSettings, getOrganizationUsers, addUserToOrganization,
    updateOrgUser, removeOrgUser, suspendOrganization, cloneOrganization
} from "@/lib/actions/organizations";
import { exportOrgBackup, restoreOrgBackup } from "@/lib/actions/backup";
import { getOrgExportData } from "@/lib/actions/export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface Org {
    _id: string;
    name: string;
    slug: string;
    active: boolean;
    description: string;
    contactEmail: string;
    contactPhone: string;
    branding: { appName: string; accentColor: string; logoUrl: string };
    theme: string;
    settings?: {
        statuses: { key: string; label: string; color: string }[];
        sources: { key: string; label: string }[];
        products: { key: string; label: string }[];
        goals: { monthlyLeadTarget: number; monthlyConversionTarget: number };
    };
    userCount: number;
    leadCount: number;
    customerCount: number;
    conversionRate: number;
    createdAt: string;
}

interface OrgUser {
    _id: string;
    name: string;
    username: string;
    role: string;
    active: boolean;
    isSuperAdmin: boolean;
    createdAt: string;
}

type EditSection = "info" | "branding" | "theme" | "users" | "settings" | "goals" | "backup" | "export" | null;

/* ─── CSS Color → Hex Map (for <input type='color'>) ──────────────────────── */
const CSS_TO_HEX: Record<string, string> = {
    gray: "#808080", grey: "#808080", red: "#ef4444", blue: "#3b82f6",
    green: "#22c55e", yellow: "#eab308", orange: "#f97316", purple: "#a855f7",
    pink: "#ec4899", indigo: "#6366f1", emerald: "#10b981", violet: "#8b5cf6",
    teal: "#14b8a6", cyan: "#06b6d4", amber: "#f59e0b", lime: "#84cc16",
    rose: "#f43f5e", sky: "#0ea5e9", slate: "#64748b", zinc: "#71717a",
    black: "#000000", white: "#ffffff",
};
const toHex = (c: string) => c?.startsWith("#") ? c : (CSS_TO_HEX[c?.toLowerCase()] || "#808080");

/* ─── Theme Presets ─────────────────────────────────────────────────────────── */
const THEMES = [
    { key: "violet", label: "Violet", colors: ["#8b5cf6", "#6d28d9", "#a78bfa"] },
    { key: "ocean", label: "Ocean", colors: ["#0ea5e9", "#0284c7", "#38bdf8"] },
    { key: "emerald", label: "Emerald", colors: ["#10b981", "#059669", "#34d399"] },
];

/* ─── Main Component ────────────────────────────────────────────────────────── */
export function OrganizationsTab({ orgs: initialOrgs, currentOrgId }: { orgs: Org[]; currentOrgId?: string }) {
    const [orgs] = useState(initialOrgs);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editSection, setEditSection] = useState<EditSection>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Create form
    const [createForm, setCreateForm] = useState({
        name: "", slug: "", description: "", contactEmail: "", contactPhone: "",
        adminName: "", adminUsername: "", adminPassword: "",
        appName: "", accentColor: "#8b5cf6", logoUrl: "",
    });

    // Logo upload
    const logoInputRef = useRef<HTMLInputElement>(null);
    const createLogoInputRef = useRef<HTMLInputElement>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Edit forms
    const [infoForm, setInfoForm] = useState({ name: "", slug: "", description: "", contactEmail: "", contactPhone: "", active: true });
    const [brandForm, setBrandForm] = useState({ appName: "", accentColor: "#8b5cf6", logoUrl: "" });
    const [themeForm, setThemeForm] = useState("violet");
    const [goalsForm, setGoalsForm] = useState({ monthlyLeadTarget: 50, monthlyConversionTarget: 10 });

    // Settings editing
    const [settingsForm, setSettingsForm] = useState<{
        statuses: { key: string; label: string; color: string }[];
        sources: { key: string; label: string }[];
        products: { key: string; label: string }[];
    }>({ statuses: [], sources: [], products: [] });

    // Backup
    const backupInputRef = useRef<HTMLInputElement>(null);
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreResult, setRestoreResult] = useState<string | null>(null);

    // Users
    const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [addUserForm, setAddUserForm] = useState({ name: "", username: "", password: "", role: "SALES" });

    // Clone org
    const [showClone, setShowClone] = useState<string | null>(null);
    const [cloneForm, setCloneForm] = useState({ name: "", slug: "", adminName: "", adminUsername: "", adminPassword: "" });

    // Confirmation dialog state (replaces window.confirm)
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        variant: "danger" | "warning";
        onConfirm: () => void;
    } | null>(null);

    // Helper: is this the main org?
    const isMainOrg = (orgId: string) => orgId === currentOrgId;

    /* ─── Handlers ─────────────────────────────────────────────────────────── */
    /* ── Logo Upload Handler ──────────────────────────────────────────── */
    const handleLogoUpload = async (file: File, target: "brand" | "create") => {
        setUploadingLogo(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const json = await res.json();
            if (json.error) { toast({ title: json.error, variant: "destructive" }); }
            else if (target === "brand") setBrandForm(f => ({ ...f, logoUrl: json.url }));
            else setCreateForm(f => ({ ...f, logoUrl: json.url }));
        } catch { toast({ title: "Upload failed", variant: "destructive" }); }
        setUploadingLogo(false);
    };

    const handleCreate = async () => {
        if (!createForm.name || !createForm.slug || !createForm.adminUsername || !createForm.adminPassword) {
            toast({ title: "Name, slug, admin username & password are required", variant: "destructive" });
            return;
        }
        if (createForm.adminUsername.toLowerCase() === "admin") {
            toast({ title: "Admin username cannot be 'admin' to avoid conflicts with the main admin", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const result = await createOrganization({
                name: createForm.name,
                slug: createForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                description: createForm.description,
                contactEmail: createForm.contactEmail,
                contactPhone: createForm.contactPhone,
                adminName: createForm.adminName || "Admin",
                adminUsername: createForm.adminUsername,
                adminPassword: createForm.adminPassword,
                appName: createForm.appName || createForm.name,
                accentColor: createForm.accentColor,
                logoUrl: createForm.logoUrl,
            });
            if (result.error) {
                toast({ title: result.error, variant: "destructive" });
            } else {
                toast({ title: "✅ Organization created successfully!" });
                setShowCreate(false);
                setCreateForm({ name: "", slug: "", description: "", contactEmail: "", contactPhone: "", adminName: "", adminUsername: "", adminPassword: "", appName: "", accentColor: "#8b5cf6", logoUrl: "" });
                window.location.reload();
            }
        } catch {
            toast({ title: "Failed to create organization", variant: "destructive" });
        }
        setLoading(false);
    };

    const expandOrg = async (org: Org) => {
        if (expandedId === org._id) { setExpandedId(null); setEditSection(null); return; }
        setExpandedId(org._id);
        const defaultSection = isMainOrg(org._id) ? "branding" : "info";
        setEditSection(defaultSection);
        setInfoForm({ name: org.name, slug: org.slug, description: org.description || "", contactEmail: org.contactEmail || "", contactPhone: org.contactPhone || "", active: org.active });
        setBrandForm({ appName: org.branding?.appName || "", accentColor: org.branding?.accentColor || "#8b5cf6", logoUrl: org.branding?.logoUrl || "" });
        setThemeForm(org.theme || "violet");
        setGoalsForm({ monthlyLeadTarget: org.settings?.goals?.monthlyLeadTarget || 50, monthlyConversionTarget: org.settings?.goals?.monthlyConversionTarget || 10 });
        setSettingsForm({
            statuses: (org.settings?.statuses || []).map(s => ({ ...s, color: toHex(s.color) })),
            sources: org.settings?.sources || [],
            products: org.settings?.products || [],
        });
        setRestoreResult(null);
    };

    const saveInfo = async (orgId: string) => {
        setLoading(true);
        const res = await updateOrganization(orgId, { name: infoForm.name, slug: infoForm.slug, description: infoForm.description, contactEmail: infoForm.contactEmail, contactPhone: infoForm.contactPhone, active: infoForm.active });
        toast({ title: res.error || "✅ Info updated!" });
        if (!res.error) window.location.reload();
        setLoading(false);
    };

    const saveBranding = async (orgId: string) => {
        setLoading(true);
        const res = await updateOrganization(orgId, { branding: brandForm });
        toast({ title: res.error || "✅ Branding updated!" });
        if (!res.error) window.location.reload();
        setLoading(false);
    };

    const saveTheme = async (orgId: string) => {
        setLoading(true);
        const res = await updateOrganization(orgId, { theme: themeForm as any });
        toast({ title: res.error || "✅ Theme updated!" });
        if (!res.error) window.location.reload();
        setLoading(false);
    };

    const saveGoals = async (orgId: string) => {
        setLoading(true);
        const res = await updateOrganizationSettings(orgId, { goals: goalsForm });
        toast({ title: res.error || "✅ Goals updated!" });
        if (!res.error) window.location.reload();
        setLoading(false);
    };

    const saveSettings = async (orgId: string) => {
        setLoading(true);
        const res = await updateOrganizationSettings(orgId, {
            statuses: settingsForm.statuses,
            sources: settingsForm.sources,
            products: settingsForm.products,
        });
        toast({ title: res.error || "\u2705 Settings updated!" });
        if (!res.error) window.location.reload();
        setLoading(false);
    };

    const handleBackupExport = async (orgId: string, orgName: string) => {
        setBackupLoading(true);
        try {
            const result = await exportOrgBackup(orgId);
            if (result.error) { toast({ title: result.error, variant: "destructive" }); setBackupLoading(false); return; }
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `backup_${orgName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: "\u2705 Backup downloaded!" });
        } catch { toast({ title: "Backup failed", variant: "destructive" }); }
        setBackupLoading(false);
    };

    const handleBackupRestore = async (orgId: string) => {
        const file = backupInputRef.current?.files?.[0];
        if (!file) { toast({ title: "Please select a backup file", variant: "destructive" }); return; }
        if (!confirm("This will restore data into this organization. Existing data will be merged. Continue?")) return;
        setBackupLoading(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const result = await restoreOrgBackup(orgId, data, { mode: "merge" });
            if (result.error) { toast({ title: result.error, variant: "destructive" }); setBackupLoading(false); return; }
            setRestoreResult(result.message || "Restore complete");
            toast({ title: "\u2705 " + (result.message || "Restore complete") });
            if (backupInputRef.current) backupInputRef.current.value = "";
        } catch { toast({ title: "Invalid backup file", variant: "destructive" }); }
        setBackupLoading(false);
    };

    const loadUsers = async (orgId: string) => {
        setLoadingUsers(true);
        const users = await getOrganizationUsers(orgId);
        setOrgUsers(users);
        setLoadingUsers(false);
    };

    const handleAddUser = async (orgId: string) => {
        if (!addUserForm.name || !addUserForm.username || !addUserForm.password) {
            toast({ title: "All fields required", variant: "destructive" }); return;
        }
        setLoading(true);
        const res = await addUserToOrganization(orgId, addUserForm);
        if (res.error) {
            toast({ title: res.error, variant: "destructive" });
        } else {
            toast({ title: "✅ User added!" });
            setShowAddUser(false);
            setAddUserForm({ name: "", username: "", password: "", role: "SALES" });
            loadUsers(orgId);
        }
        setLoading(false);
    };

    const handleDeactivate = (orgId: string) => {
        setConfirmAction({
            title: "Deactivate Organization",
            message: "Are you sure? Users will no longer be able to log in to this organization.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmAction(null);
                setLoading(true);
                const res = await deleteOrganization(orgId);
                toast({ title: res.error || "✅ Organization deactivated" });
                if (!res.error) window.location.reload();
                setLoading(false);
            },
        });
    };

    const handleSuspend = (orgId: string, suspend: boolean) => {
        setConfirmAction({
            title: suspend ? "Suspend Organization" : "Resume Organization",
            message: suspend
                ? "Suspend this organization? All users will be blocked from logging in."
                : "Resume this organization? All users will be reactivated.",
            variant: suspend ? "warning" : "warning",
            onConfirm: async () => {
                setConfirmAction(null);
                setLoading(true);
                const res = await suspendOrganization(orgId, suspend);
                toast({ title: res.error || res.message || "✅ Done" });
                if (!res.error) window.location.reload();
                setLoading(false);
            },
        });
    };

    const handleHardDelete = (orgId: string, orgName: string) => {
        setConfirmAction({
            title: "⚠️ Permanently Delete Organization",
            message: `This will PERMANENTLY delete "${orgName}" and ALL its data (users, leads, notes, audit logs, notifications). This action CANNOT be undone.`,
            variant: "danger",
            onConfirm: async () => {
                setConfirmAction(null);
                setLoading(true);
                const res = await hardDeleteOrganization(orgId);
                if (res.error) {
                    toast({ title: res.error, variant: "destructive" });
                } else {
                    const s = res.summary;
                    toast({ title: `✅ "${orgName}" permanently deleted — ${s?.users || 0} users, ${s?.leads || 0} leads, ${s?.notes || 0} notes removed` });
                    window.location.reload();
                }
                setLoading(false);
            },
        });
    };

    const handleClone = async (sourceOrgId: string) => {
        if (!cloneForm.name || !cloneForm.slug || !cloneForm.adminUsername || !cloneForm.adminPassword) {
            toast({ title: "All required fields must be filled", variant: "destructive" }); return;
        }
        setLoading(true);
        const res = await cloneOrganization(sourceOrgId, cloneForm);
        if (res.error) {
            toast({ title: res.error, variant: "destructive" });
        } else {
            toast({ title: "✅ Organization cloned successfully!" });
            setShowClone(null);
            setCloneForm({ name: "", slug: "", adminName: "", adminUsername: "", adminPassword: "" });
            window.location.reload();
        }
        setLoading(false);
    };

    const handleUpdateUser = async (orgId: string, userId: string, data: { role?: string; active?: boolean }) => {
        setLoading(true);
        const res = await updateOrgUser(orgId, userId, data);
        if (res.error) {
            toast({ title: res.error, variant: "destructive" });
        } else {
            toast({ title: "✅ User updated!" });
            loadUsers(orgId);
        }
        setLoading(false);
    };

    const handleRemoveUser = (orgId: string, userId: string, userName: string) => {
        setConfirmAction({
            title: "Remove User",
            message: `Remove user "${userName}" from this organization? This action cannot be undone.`,
            variant: "danger",
            onConfirm: async () => {
                setConfirmAction(null);
                setLoading(true);
                const res = await removeOrgUser(orgId, userId);
                if (res.error) {
                    toast({ title: res.error, variant: "destructive" });
                } else {
                    toast({ title: "✅ User removed!" });
                    loadUsers(orgId);
                }
                setLoading(false);
            },
        });
    };

    const handleExport = async (orgId: string, orgName: string, format: "excel" | "pdf" | "word", lang: "en" | "ar") => {
        setLoading(true);
        try {
            const data = await getOrgExportData(orgId);
            if (data.error || !data.leads) { toast({ title: data.error || "Export failed", variant: "destructive" }); setLoading(false); return; }

            const headers = lang === "ar"
                ? ["الاسم", "الهاتف", "البريد", "المصدر", "الحالة", "المنتج", "الشركة", "ملاحظات", "المسؤول", "التاريخ"]
                : ["Name", "Phone", "Email", "Source", "Status", "Product", "Company", "Notes", "Assigned To", "Date"];

            const rows = data.leads.map((l: any) => [l.name, l.phone, l.email, l.source, l.status, l.product, l.company, l.notes, l.assignedTo, l.createdAt ? new Date(l.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US") : ""]);

            const title = lang === "ar" ? `تقرير بيانات - ${orgName}` : `${orgName} - Leads Report`;
            const date = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US");

            if (format === "excel") {
                const XLSX = (await import("xlsx"));
                const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
                ws["!cols"] = headers.map(() => ({ wch: 18 }));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Leads");
                XLSX.writeFile(wb, `${orgName}_leads_${lang}.xlsx`);
            } else if (format === "pdf") {
                const { jsPDF } = await import("jspdf");
                const doc = new jsPDF({ orientation: "landscape" });
                doc.setFontSize(18);
                doc.text(title, 14, 22);
                doc.setFontSize(10);
                doc.text(date, 14, 30);

                let y = 40;
                const colW = [30, 22, 30, 18, 18, 22, 22, 40, 22, 22];
                // Header
                doc.setFillColor(139, 92, 246);
                doc.rect(14, y - 5, 265, 8, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7);
                headers.forEach((h, i) => { doc.text(h, 15 + colW.slice(0, i).reduce((a, b: number) => a + b, 0), y); });
                doc.setTextColor(0, 0, 0);
                y += 8;

                // Rows
                rows.forEach((row: string[]) => {
                    if (y > 190) { doc.addPage(); y = 20; }
                    doc.setFontSize(6);
                    row.forEach((cell: string, i: number) => {
                        doc.text(String(cell).substring(0, 28), 15 + colW.slice(0, i).reduce((a, b: number) => a + b, 0), y);
                    });
                    y += 6;
                });

                doc.save(`${orgName}_leads_${lang}.pdf`);
            } else if (format === "word") {
                const dir = lang === "ar" ? "rtl" : "ltr";
                const html = `<html dir="${dir}"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;direction:${dir};padding:20px}h1{color:#8b5cf6;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#8b5cf6;color:white;padding:8px;font-size:11px;text-align:${lang === "ar" ? "right" : "left"}}td{border:1px solid #ddd;padding:6px;font-size:10px}.date{color:#666;font-size:12px}</style></head><body><h1>${title}</h1><p class="date">${date}</p><table><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>${rows.map((r: string[]) => `<tr>${r.map((c: string) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
                const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${orgName}_leads_${lang}.doc`; a.click();
                URL.revokeObjectURL(url);
            }

            toast({ title: `✅ ${format.charAt(0).toUpperCase() + format.slice(1)} exported!` });
        } catch (err: any) {
            toast({ title: err.message || "Export failed", variant: "destructive" });
        }
        setLoading(false);
    };

    /* ─── Section Tab Button ───────────────────────────────────────────────── */
    const SectionBtn = ({ section, icon: Icon, label, orgId }: { section: EditSection; icon: any; label: string; orgId: string }) => (
        <button
            onClick={() => {
                setEditSection(section);
                if (section === "users") loadUsers(orgId);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editSection === section
                ? "bg-primary text-white shadow-md"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );

    /* ─── Render ───────────────────────────────────────────────────────────── */
    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Organizations
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Manage all organizations. Each has its own users, leads, branding, and settings.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {orgs.length} orgs</span>
                                <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {orgs.reduce((s, o) => s + o.userCount, 0)} users</span>
                                <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> {orgs.reduce((s, o) => s + o.leadCount, 0)} leads</span>
                            </div>
                            <Button
                                onClick={() => setShowCreate(!showCreate)}
                                className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Organization
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* ── Create Form ──────────────────────────────────────────────── */}
            {showCreate && (
                <Card className="bg-card/60 backdrop-blur-xl border-primary/20 rounded-3xl shadow-xl animate-in slide-in-from-top-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Create New Organization</CardTitle>
                        <CardDescription>Set up a new standalone organization with its own admin account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Org Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Organization Name *</Label>
                                <Input
                                    placeholder="e.g. Acme Corp"
                                    value={createForm.name}
                                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))}
                                    className="bg-white/5 border-white/10 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (URL identifier) *</Label>
                                <Input
                                    placeholder="acme-corp"
                                    value={createForm.slug}
                                    onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))}
                                    className="bg-white/5 border-white/10 rounded-xl font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Brief description of the organization"
                                value={createForm.description}
                                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input placeholder="admin@acme.com" value={createForm.contactEmail} onChange={e => setCreateForm(f => ({ ...f, contactEmail: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Phone</Label>
                                <Input placeholder="+971..." value={createForm.contactPhone} onChange={e => setCreateForm(f => ({ ...f, contactPhone: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                            </div>
                        </div>

                        {/* Admin Account */}
                        <div className="border-t border-white/10 pt-4">
                            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"><Shield className="h-4 w-4" /> Initial Admin Account</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Admin Name</Label>
                                    <Input placeholder="Admin" value={createForm.adminName} onChange={e => setCreateForm(f => ({ ...f, adminName: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Admin Username *</Label>
                                    <Input placeholder="admin" value={createForm.adminUsername} onChange={e => setCreateForm(f => ({ ...f, adminUsername: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Admin Password *</Label>
                                    <Input type="password" placeholder="••••••" value={createForm.adminPassword} onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Branding */}
                        <div className="border-t border-white/10 pt-4">
                            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"><Palette className="h-4 w-4" /> Branding</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>App Display Name</Label>
                                    <Input placeholder="e.g. SMTC Group" value={createForm.appName} onChange={e => setCreateForm(f => ({ ...f, appName: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Accent Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <div className="h-10 w-10 rounded-xl border border-white/20 shadow-inner flex-shrink-0 branding-preview" style={{ '--accent-color': createForm.accentColor } as React.CSSProperties} />
                                        <Input type="color" title="Pick accent color" value={createForm.accentColor} onChange={e => setCreateForm(f => ({ ...f, accentColor: e.target.value }))} className="h-10 w-16 p-0 border-0 cursor-pointer bg-transparent" />
                                        <Input value={createForm.accentColor} onChange={e => setCreateForm(f => ({ ...f, accentColor: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl font-mono text-sm flex-1" maxLength={7} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-2">
                                <Label>Organization Logo</Label>
                                <div className="flex items-center gap-4">
                                    {createForm.logoUrl ? (
                                        <div className="relative">
                                            <img src={createForm.logoUrl} alt="" className="h-16 w-16 rounded-xl object-contain bg-white/5 border border-white/10 p-1" />
                                            <button title="Remove logo" onClick={() => setCreateForm(f => ({ ...f, logoUrl: "" }))} className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                                                <X className="h-3 w-3 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => createLogoInputRef.current?.click()} disabled={uploadingLogo} className="h-16 w-16 rounded-xl border-2 border-dashed border-white/15 hover:border-primary/40 flex items-center justify-center transition-colors">
                                            {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
                                        </button>
                                    )}
                                    <input ref={createLogoInputRef} type="file" accept="image/*" title="Upload organization logo" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f, "create"); }} />
                                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP, SVG • Max 2MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleCreate} disabled={loading} className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                Create Organization
                            </Button>
                            <Button variant="ghost" onClick={() => setShowCreate(false)} className="rounded-xl">
                                <X className="h-4 w-4 mr-2" /> Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Organizations List ───────────────────────────────────────── */}
            <div className="grid gap-4">
                {orgs.map(org => (
                    <Card
                        key={org._id}
                        className={`bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl shadow-xl transition-all hover:shadow-primary/5 ${!org.active ? "opacity-50" : ""} ${expandedId === org._id ? "ring-2 ring-primary/30" : ""}`}
                    >
                        <CardContent className="p-0">
                            {/* ─── Org Card Header ───── */}
                            <div
                                className="flex items-center justify-between p-4 sm:p-6 cursor-pointer gap-3"
                                onClick={() => expandOrg(org)}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="org-logo-swatch h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg text-white font-bold text-xl flex-shrink-0 accent-gradient-logo"
                                        style={{ '--accent': org.branding?.accentColor || '#8b5cf6' } as React.CSSProperties}
                                    >
                                        {org.branding?.logoUrl ? (
                                            <img src={org.branding.logoUrl} alt="" className="h-9 w-9 object-contain" />
                                        ) : (
                                            org.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                                            <span className="truncate max-w-[180px] sm:max-w-[300px]">{org.name}</span>
                                            {isMainOrg(org._id) && (
                                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider flex items-center gap-1">
                                                    <Crown className="h-3 w-3" /> Main
                                                </span>
                                            )}
                                            {!org.active && (
                                                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider">
                                                    Suspended
                                                </span>
                                            )}
                                            {org.branding?.appName && org.branding.appName !== org.name && (
                                                <span className="text-xs text-muted-foreground">({org.branding.appName})</span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 overflow-hidden">
                                            <span className="flex items-center gap-1 font-mono text-xs truncate max-w-[120px] sm:max-w-[200px]"><Globe className="h-3 w-3 flex-shrink-0" /> {org.slug}</span>
                                            {org.description && <span className="hidden lg:block">• {org.description.slice(0, 40)}{org.description.length > 40 ? "…" : ""}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Stat badges */}
                                    <div className="hidden md:flex items-center gap-3">
                                        <StatBadge icon={Users} value={org.userCount} label="Users" color="blue" />
                                        <StatBadge icon={BarChart3} value={org.leadCount} label="Leads" color="violet" />
                                        <StatBadge icon={Target} value={`${org.conversionRate}%`} label="Conv" color="emerald" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Suspend/Resume toggle */}
                                        {!isMainOrg(org._id) && (
                                            <Button variant="ghost" size="sm" title={org.active ? "Suspend" : "Resume"} onClick={(e) => { e.stopPropagation(); handleSuspend(org._id, org.active); }} className={`rounded-xl ${org.active ? 'hover:bg-amber-500/10 text-amber-400' : 'hover:bg-green-500/10 text-green-400'}`}>
                                                {org.active ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            </Button>
                                        )}
                                        {/* Clone */}
                                        <Button variant="ghost" size="sm" title="Clone" onClick={(e) => { e.stopPropagation(); setShowClone(showClone === org._id ? null : org._id); setCloneForm({ name: '', slug: '', adminName: '', adminUsername: '', adminPassword: '' }); }} className="rounded-xl hover:bg-blue-500/10 text-blue-400">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        {/* Delete */}
                                        {!isMainOrg(org._id) && org.active && (
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeactivate(org._id); }} className="rounded-xl hover:bg-red-500/10 text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {/* Hard delete — only for suspended orgs */}
                                        {!isMainOrg(org._id) && !org.active && (
                                            <Button variant="ghost" size="sm" title="Permanently Delete" onClick={(e) => { e.stopPropagation(); handleHardDelete(org._id, org.name); }} className="rounded-xl hover:bg-red-600/20 text-red-500 font-bold">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {expandedId === org._id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>

                            {/* ─── Clone Form ───── */}
                            {showClone === org._id && (
                                <div className="border-t border-blue-500/20 bg-blue-500/5 p-6 animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Copy className="h-5 w-5 text-blue-400" />
                                        <h4 className="text-sm font-semibold">Clone &ldquo;{org.name}&rdquo;</h4>
                                        <p className="text-xs text-muted-foreground ml-auto">Settings, branding, and theme will be copied</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <Input placeholder="New Org Name *" value={cloneForm.name} onChange={e => setCloneForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }))} className="bg-white/5 border-white/10 rounded-xl" />
                                        <Input placeholder="Slug *" value={cloneForm.slug} onChange={e => setCloneForm(f => ({ ...f, slug: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl font-mono text-sm" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Admin account for the cloned org</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                        <Input placeholder="Admin Name" value={cloneForm.adminName} onChange={e => setCloneForm(f => ({ ...f, adminName: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                        <Input placeholder="Admin Username *" value={cloneForm.adminUsername} onChange={e => setCloneForm(f => ({ ...f, adminUsername: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                        <Input type="password" placeholder="Admin Password *" value={cloneForm.adminPassword} onChange={e => setCloneForm(f => ({ ...f, adminPassword: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" disabled={loading} onClick={() => handleClone(org._id)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Clone Organization
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setShowClone(null)} className="rounded-xl">Cancel</Button>
                                    </div>
                                </div>
                            )}

                            {/* ─── Expanded Management Panel ───── */}
                            {expandedId === org._id && (
                                <div className="border-t border-white/10 animate-in slide-in-from-top-2">
                                    {/* Section tabs */}
                                    <div className="flex flex-wrap gap-2 px-6 py-3 bg-white/[0.02] border-b border-white/5">
                                        {!isMainOrg(org._id) && <SectionBtn section="info" icon={Info} label="Info" orgId={org._id} />}
                                        <SectionBtn section="branding" icon={Palette} label="Branding" orgId={org._id} />
                                        {!isMainOrg(org._id) && <SectionBtn section="theme" icon={Eye} label="Theme" orgId={org._id} />}
                                        <SectionBtn section="users" icon={Users} label="Users" orgId={org._id} />
                                        {!isMainOrg(org._id) && <SectionBtn section="goals" icon={Target} label="Goals" orgId={org._id} />}
                                        {!isMainOrg(org._id) && <SectionBtn section="settings" icon={Package} label="Settings" orgId={org._id} />}
                                        <SectionBtn section="backup" icon={Database} label="Backup" orgId={org._id} />
                                        <SectionBtn section="export" icon={FileDown} label="Export" orgId={org._id} />
                                    </div>

                                    <div className="p-6">
                                        {/* ── INFO SECTION ── */}
                                        {editSection === "info" && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField label="Organization Name" value={infoForm.name} onChange={v => setInfoForm(f => ({ ...f, name: v }))} />
                                                    <InputField label="Slug" value={infoForm.slug} onChange={v => setInfoForm(f => ({ ...f, slug: v }))} mono />
                                                    <InputField label="Description" value={infoForm.description} onChange={v => setInfoForm(f => ({ ...f, description: v }))} placeholder="Brief description" />
                                                    <InputField label="Contact Email" value={infoForm.contactEmail} onChange={v => setInfoForm(f => ({ ...f, contactEmail: v }))} icon={Mail} />
                                                    <InputField label="Contact Phone" value={infoForm.contactPhone} onChange={v => setInfoForm(f => ({ ...f, contactPhone: v }))} icon={Phone} />
                                                    <div className="flex items-end gap-3">
                                                        <label className="flex items-center gap-2 text-sm cursor-pointer bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
                                                            <input type="checkbox" checked={infoForm.active} onChange={e => setInfoForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
                                                            Active
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Created: {org.createdAt ? new Date(org.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                                                </div>
                                                <SaveBar loading={loading} onSave={() => saveInfo(org._id)} />
                                            </div>
                                        )}

                                        {/* ── BRANDING SECTION ── */}
                                        {editSection === "branding" && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField label="App Display Name" value={brandForm.appName} onChange={v => setBrandForm(f => ({ ...f, appName: v }))} />
                                                    <div className="space-y-2">
                                                        <Label className="text-sm">Accent Color</Label>
                                                        <div className="flex gap-2 items-center">
                                                            <div className="org-color-preview h-10 w-10 rounded-xl border border-white/20 shadow-inner flex-shrink-0 branding-preview" style={{ '--accent-color': brandForm.accentColor } as React.CSSProperties} />
                                                            <Input type="color" title="Pick accent color" value={brandForm.accentColor} onChange={e => setBrandForm(f => ({ ...f, accentColor: e.target.value }))} className="h-10 w-16 p-0 border-0 cursor-pointer bg-transparent" />
                                                            <Input value={brandForm.accentColor} onChange={e => setBrandForm(f => ({ ...f, accentColor: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl font-mono text-sm flex-1" maxLength={7} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Logo Upload */}
                                                <div className="space-y-2">
                                                    <Label className="text-sm">Organization Logo</Label>
                                                    <div className="flex items-center gap-4">
                                                        {brandForm.logoUrl ? (
                                                            <div className="relative group">
                                                                <img src={brandForm.logoUrl} alt="" className="h-20 w-20 rounded-2xl object-contain bg-white/5 border border-white/10 p-2" />
                                                                <button
                                                                    onClick={() => setBrandForm(f => ({ ...f, logoUrl: "" }))}
                                                                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                                                                    title="Remove logo"
                                                                >
                                                                    <Trash className="h-3 w-3 text-white" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => logoInputRef.current?.click()}
                                                                disabled={uploadingLogo}
                                                                className="h-20 w-20 rounded-2xl border-2 border-dashed border-white/15 hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                                                            >
                                                                {uploadingLogo ? (
                                                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                                ) : (
                                                                    <>
                                                                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                                                        <span className="text-[10px] text-muted-foreground">Upload</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        <input
                                                            ref={logoInputRef}
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                            className="hidden"
                                                            onChange={e => {
                                                                const f = e.target.files?.[0];
                                                                if (f) handleLogoUpload(f, "brand");
                                                                if (logoInputRef.current) logoInputRef.current.value = "";
                                                            }}
                                                        />
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <p>Upload your organization logo</p>
                                                            <p className="text-muted-foreground/60">PNG, JPG, WebP, SVG • Max 2MB</p>
                                                            <p className="text-muted-foreground/60">Appears on the login page when this org is selected</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Live Preview */}
                                                <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-3">Login Page Preview</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="org-preview-logo h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg accent-gradient-logo" style={{ '--accent': brandForm.accentColor } as React.CSSProperties}>
                                                            {brandForm.logoUrl ? <img src={brandForm.logoUrl} alt="" className="h-9 w-9 object-contain" /> : (brandForm.appName || "A").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{brandForm.appName || org.name}</p>
                                                            <p className="text-xs text-muted-foreground">Premium Dashboard</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <SaveBar loading={loading} onSave={() => saveBranding(org._id)} />
                                            </div>
                                        )}

                                        {/* ── THEME SECTION ── */}
                                        {editSection === "theme" && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-muted-foreground">Choose a color theme for this organization&apos;s interface</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {THEMES.map(t => (
                                                        <button
                                                            key={t.key}
                                                            onClick={() => setThemeForm(t.key)}
                                                            className={`p-4 rounded-2xl border-2 transition-all ${themeForm === t.key ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                                                        >
                                                            <div className="flex gap-2 mb-3">
                                                                {t.colors.map((c, i) => (
                                                                    <div key={i} className="h-8 w-8 rounded-lg branding-preview" style={{ '--accent-color': c } as React.CSSProperties} />
                                                                ))}
                                                            </div>
                                                            <p className="text-sm font-medium">{t.label}</p>
                                                            {themeForm === t.key && <p className="text-xs text-primary mt-1">Active</p>}
                                                        </button>
                                                    ))}
                                                </div>
                                                <SaveBar loading={loading} onSave={() => saveTheme(org._id)} />
                                            </div>
                                        )}

                                        {/* ── USERS SECTION ── */}
                                        {editSection === "users" && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-muted-foreground">Manage users for <strong>{org.name}</strong></p>
                                                    <Button size="sm" onClick={() => setShowAddUser(!showAddUser)} className="rounded-xl bg-primary/20 text-primary hover:bg-primary/30">
                                                        <UserPlus className="h-4 w-4 mr-1.5" /> Add User
                                                    </Button>
                                                </div>

                                                {/* Add user form */}
                                                {showAddUser && (
                                                    <Card className="bg-white/[0.03] border-primary/20 rounded-2xl">
                                                        <CardContent className="p-4 space-y-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                                <Input placeholder="Full Name" value={addUserForm.name} onChange={e => setAddUserForm(f => ({ ...f, name: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                                                <Input placeholder="Username" value={addUserForm.username} onChange={e => setAddUserForm(f => ({ ...f, username: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                                                <Input type="password" placeholder="Password" value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                                                                <Select value={addUserForm.role} onValueChange={v => setAddUserForm(f => ({ ...f, role: v }))}>
                                                                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                                        <SelectItem value="MARKETING">Marketing</SelectItem>
                                                                        <SelectItem value="SALES">Sales</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button size="sm" disabled={loading} onClick={() => handleAddUser(org._id)} className="rounded-xl bg-green-600 hover:bg-green-700 text-white">
                                                                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />} Add
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setShowAddUser(false)} className="rounded-xl">Cancel</Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Users list with full CRUD */}
                                                {loadingUsers ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {orgUsers.map(u => (
                                                            <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary">
                                                                        {u.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium flex items-center gap-2">
                                                                            {u.name}
                                                                            {u.isSuperAdmin && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Super</span>}
                                                                            {!u.active && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Inactive</span>}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {/* Role selector */}
                                                                    {!u.isSuperAdmin && (
                                                                        <Select value={u.role} onValueChange={v => handleUpdateUser(org._id, u._id, { role: v })}>
                                                                            <SelectTrigger className="w-[110px] h-8 bg-white/5 border-white/10 rounded-lg text-xs">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                                                                <SelectItem value="MARKETING">Marketing</SelectItem>
                                                                                <SelectItem value="SALES">Sales</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    )}
                                                                    {u.isSuperAdmin && <RoleBadge role={u.role} />}
                                                                    {/* Toggle active */}
                                                                    {!u.isSuperAdmin && (
                                                                        <Button variant="ghost" size="icon" title={u.active ? 'Deactivate' : 'Activate'} className={`h-8 w-8 rounded-lg ${u.active ? 'hover:bg-amber-500/10 text-amber-400' : 'hover:bg-green-500/10 text-green-400'}`} onClick={() => handleUpdateUser(org._id, u._id, { active: !u.active })}>
                                                                            {u.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                                        </Button>
                                                                    )}
                                                                    {/* Remove */}
                                                                    {!u.isSuperAdmin && (
                                                                        <Button variant="ghost" size="icon" title="Remove user" className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-400" onClick={() => handleRemoveUser(org._id, u._id, u.name)}>
                                                                            <UserX className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {orgUsers.length === 0 && !loadingUsers && (
                                                            <p className="text-sm text-muted-foreground text-center py-6">No users found for this organization</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── GOALS SECTION ── */}
                                        {editSection === "goals" && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-muted-foreground">Set monthly targets for this organization</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm">Monthly Lead Target</Label>
                                                        <Input type="number" value={goalsForm.monthlyLeadTarget} onChange={e => setGoalsForm(f => ({ ...f, monthlyLeadTarget: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm">Monthly Conversion Target</Label>
                                                        <Input type="number" value={goalsForm.monthlyConversionTarget} onChange={e => setGoalsForm(f => ({ ...f, monthlyConversionTarget: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 rounded-xl" />
                                                    </div>
                                                </div>
                                                <SaveBar loading={loading} onSave={() => saveGoals(org._id)} />
                                            </div>
                                        )}

                                        {/* ── SETTINGS SECTION (editable) ── */}
                                        {editSection === "settings" && (
                                            <div className="space-y-6">
                                                <p className="text-sm text-muted-foreground">Edit statuses, sources, and products for this organization.</p>

                                                {/* Statuses */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Statuses ({settingsForm.statuses.length})</p>
                                                        <Button size="sm" variant="ghost" className="rounded-lg text-xs h-7 gap-1" onClick={() => setSettingsForm(f => ({ ...f, statuses: [...f.statuses, { key: `status_${Date.now()}`, label: "New Status", color: "#6b7280" }] }))}>
                                                            <Plus className="h-3 w-3" /> Add
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {settingsForm.statuses.map((s, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                                                                <input type="color" title="Status color" value={s.color} onChange={e => { const arr = [...settingsForm.statuses]; arr[i] = { ...arr[i], color: e.target.value }; setSettingsForm(f => ({ ...f, statuses: arr })); }} className="h-8 w-8 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0" />
                                                                <Input value={s.key} onChange={e => { const arr = [...settingsForm.statuses]; arr[i] = { ...arr[i], key: e.target.value }; setSettingsForm(f => ({ ...f, statuses: arr })); }} className="bg-white/5 border-white/10 rounded-lg text-xs font-mono flex-1 h-8" placeholder="key" />
                                                                <Input value={s.label} onChange={e => { const arr = [...settingsForm.statuses]; arr[i] = { ...arr[i], label: e.target.value }; setSettingsForm(f => ({ ...f, statuses: arr })); }} className="bg-white/5 border-white/10 rounded-lg text-xs flex-1 h-8" placeholder="Label" />
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-red-500/10 text-red-400 flex-shrink-0" onClick={() => setSettingsForm(f => ({ ...f, statuses: f.statuses.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Sources */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Sources ({settingsForm.sources.length})</p>
                                                        <Button size="sm" variant="ghost" className="rounded-lg text-xs h-7 gap-1" onClick={() => setSettingsForm(f => ({ ...f, sources: [...f.sources, { key: `source_${Date.now()}`, label: "New Source" }] }))}>
                                                            <Plus className="h-3 w-3" /> Add
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {settingsForm.sources.map((s, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                                                                <Input value={s.key} onChange={e => { const arr = [...settingsForm.sources]; arr[i] = { ...arr[i], key: e.target.value }; setSettingsForm(f => ({ ...f, sources: arr })); }} className="bg-white/5 border-white/10 rounded-lg text-xs font-mono flex-1 h-8" placeholder="key" />
                                                                <Input value={s.label} onChange={e => { const arr = [...settingsForm.sources]; arr[i] = { ...arr[i], label: e.target.value }; setSettingsForm(f => ({ ...f, sources: arr })); }} className="bg-white/5 border-white/10 rounded-lg text-xs flex-1 h-8" placeholder="Label" />
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-red-500/10 text-red-400 flex-shrink-0" onClick={() => setSettingsForm(f => ({ ...f, sources: f.sources.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Products */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Products ({settingsForm.products.length})</p>
                                                        <Button size="sm" variant="ghost" className="rounded-lg text-xs h-7 gap-1" onClick={() => setSettingsForm(f => ({ ...f, products: [...f.products, { key: `product_${Date.now()}`, label: "New Product" }] }))}>
                                                            <Plus className="h-3 w-3" /> Add
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {settingsForm.products.map((p, i) => (
                                                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                                                                <Input value={p.key} onChange={e => { const arr = [...settingsForm.products]; arr[i] = { ...arr[i], key: e.target.value }; setSettingsForm(f => ({ ...f, products: arr })); }} className="bg-white/5 border-white/10 rounded-lg text-xs font-mono flex-1 h-8" placeholder="key" />
                                                                <Input value={p.label} onChange={e => { const arr = [...settingsForm.products]; arr[i] = { ...arr[i], label: e.target.value }; setSettingsForm(f => ({ ...f, products: arr })); }} className="bg-white/5 border-white/10 rounded-lg text-xs flex-1 h-8" placeholder="Label" />
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-red-500/10 text-red-400 flex-shrink-0" onClick={() => setSettingsForm(f => ({ ...f, products: f.products.filter((_, idx) => idx !== i) }))}><X className="h-3 w-3" /></Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <SaveBar loading={loading} onSave={() => saveSettings(org._id)} />
                                            </div>
                                        )}

                                        {/* ── BACKUP SECTION ── */}
                                        {editSection === "backup" && (
                                            <div className="space-y-6">
                                                <p className="text-sm text-muted-foreground">Download a full backup of this organization&apos;s data or restore from a previous backup.</p>

                                                {/* Export */}
                                                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Download className="h-5 w-5 text-emerald-400" /></div>
                                                        <div>
                                                            <p className="text-sm font-semibold">Export Backup</p>
                                                            <p className="text-xs text-muted-foreground">Downloads all data: config, leads, users, notes, actions, audit logs</p>
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => handleBackupExport(org._id, org.name)} disabled={backupLoading} className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white w-full">
                                                        {backupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                                        Download Full Backup (.json)
                                                    </Button>
                                                </div>

                                                {/* Restore */}
                                                <div className="p-5 rounded-2xl bg-white/5 border border-amber-500/20 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Upload className="h-5 w-5 text-amber-400" /></div>
                                                        <div>
                                                            <p className="text-sm font-semibold">Restore from Backup</p>
                                                            <p className="text-xs text-muted-foreground">Merges backup data into this org. Existing data is preserved.</p>
                                                        </div>
                                                    </div>
                                                    <input ref={backupInputRef} type="file" accept=".json" title="Select backup file" aria-label="Select backup file" className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-400 file:rounded-lg hover:file:bg-amber-500/20 file:cursor-pointer cursor-pointer" />
                                                    <Button onClick={() => handleBackupRestore(org._id)} disabled={backupLoading} variant="outline" className="rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 w-full">
                                                        {backupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                                        Restore Backup
                                                    </Button>
                                                    {restoreResult && (
                                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                            <p className="text-xs text-emerald-400 font-medium">{restoreResult}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── EXPORT SECTION ── */}
                                        {editSection === "export" && (
                                            <div className="space-y-5">
                                                <p className="text-sm text-muted-foreground">Export all leads data from <strong>{org.name}</strong> in professionally formatted files.</p>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Excel */}
                                                    <div className="p-5 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3 hover:border-emerald-500/40 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><FileSpreadsheet className="h-5 w-5 text-emerald-400" /></div>
                                                            <div>
                                                                <p className="text-sm font-semibold">Excel (.xlsx)</p>
                                                                <p className="text-[10px] text-muted-foreground">Spreadsheet format</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" disabled={loading} onClick={() => handleExport(org._id, org.name, "excel", "en")} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1">
                                                                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} English
                                                            </Button>
                                                            <Button size="sm" disabled={loading} onClick={() => handleExport(org._id, org.name, "excel", "ar")} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1" dir="rtl">
                                                                عربي
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* PDF */}
                                                    <div className="p-5 rounded-2xl bg-white/5 border border-red-500/20 space-y-3 hover:border-red-500/40 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-red-400" /></div>
                                                            <div>
                                                                <p className="text-sm font-semibold">PDF (.pdf)</p>
                                                                <p className="text-[10px] text-muted-foreground">Print-ready document</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" disabled={loading} onClick={() => handleExport(org._id, org.name, "pdf", "en")} className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs flex-1">
                                                                English
                                                            </Button>
                                                            <Button size="sm" disabled={loading} onClick={() => handleExport(org._id, org.name, "pdf", "ar")} className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs flex-1" dir="rtl">
                                                                عربي
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Word */}
                                                    <div className="p-5 rounded-2xl bg-white/5 border border-blue-500/20 space-y-3 hover:border-blue-500/40 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-blue-400" /></div>
                                                            <div>
                                                                <p className="text-sm font-semibold">Word (.doc)</p>
                                                                <p className="text-[10px] text-muted-foreground">Editable document</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" disabled={loading} onClick={() => handleExport(org._id, org.name, "word", "en")} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs flex-1">
                                                                English
                                                            </Button>
                                                            <Button size="sm" disabled={loading} onClick={() => handleExport(org._id, org.name, "word", "ar")} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs flex-1" dir="rtl">
                                                                عربي
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {orgs.length === 0 && (
                    <Card className="bg-card/60 backdrop-blur-xl border-white/10 rounded-3xl">
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No organizations yet</p>
                            <p className="text-sm mt-1">Create your first organization to get started</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Confirmation Dialog (replaces window.confirm) ── */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
                    <div className="bg-card border border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-[90vw] space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className={`text-lg font-bold ${confirmAction.variant === "danger" ? "text-red-400" : "text-amber-400"}`}>
                            {confirmAction.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{confirmAction.message}</p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setConfirmAction(null)} className="rounded-xl">
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmAction.onConfirm}
                                disabled={loading}
                                className={`rounded-xl text-white ${confirmAction.variant === "danger"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                                    }`}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function StatBadge({ icon: Icon, value, label, color }: { icon: any; value: number | string; label: string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${colorMap[color]}`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="font-bold">{value}</span>
            <span className="opacity-70">{label}</span>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const map: Record<string, string> = {
        ADMIN: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        MARKETING: "bg-teal-500/10 text-teal-400 border-teal-500/20",
        SALES: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[role] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
            {role}
        </span>
    );
}

function InputField({ label, value, onChange, placeholder, icon: Icon, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: any; mono?: boolean }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm">{label}</Label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                <Input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`bg-white/5 border-white/10 rounded-xl ${Icon ? "pl-10" : ""} ${mono ? "font-mono text-sm" : ""}`}
                />
            </div>
        </div>
    );
}

function SaveBar({ loading, onSave }: { loading: boolean; onSave: () => void }) {
    return (
        <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={loading} className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
            </Button>
        </div>
    );
}
