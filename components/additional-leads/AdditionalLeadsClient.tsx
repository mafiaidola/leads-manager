"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Plus, Search, MoreHorizontal, Pencil, Trash2, SendHorizontal,
    CheckCircle2, XCircle, Clock, FileText, Users, NotebookPen,
    MessageSquare, ChevronDown, ChevronRight, CheckCheck, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    createAdditionalLead, updateAdditionalLead, deleteAdditionalLead,
    submitAdditionalLead, reviewAdditionalLead,
} from "@/lib/actions/additionalLeads";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props {
    initialLeads: any[];
    initialTotal: number;
    initialStats: { draft: number; pending: number; approved: number; rejected: number; total: number };
    settings: any;
    users: any[];
    currentUserRole: string;
    currentUserId: string;
    currentUserName: string;
    isAdmin: boolean;
}

// Submission status config (distinct colors for workflow state)
const SUBMISSION_CONFIG: Record<string, { label: string; color: string; icon: any; dotColor: string }> = {
    draft: { label: "Draft", color: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: FileText, dotColor: "bg-slate-400" },
    pending: { label: "Pending Review", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock, dotColor: "bg-amber-400" },
    approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2, dotColor: "bg-emerald-400" },
    rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle, dotColor: "bg-red-400" },
};

// Tab definitions
const ADMIN_TABS = [
    { key: "all", label: "All Leads", icon: NotebookPen },
    { key: "pending", label: "Pending Approval", icon: Clock },
    { key: "approved", label: "Approved", icon: CheckCircle2 },
    { key: "rejected", label: "Rejected", icon: XCircle },
] as const;

const USER_TABS = [
    { key: "all", label: "My Leads", icon: NotebookPen },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "approved", label: "Approved", icon: CheckCircle2 },
    { key: "rejected", label: "Rejected", icon: XCircle },
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdditionalLeadsClient({
    initialLeads, initialTotal, initialStats, settings, users,
    currentUserRole, currentUserId, currentUserName, isAdmin,
}: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [leads, setLeads] = useState(initialLeads);
    const [stats, setStats] = useState(initialStats);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");
    const isIQA = currentUserRole === "IQA";

    // Collapsed user groups for admin approval tab
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Form state
    const [formOpen, setFormOpen] = useState(false);
    const [editLead, setEditLead] = useState<any>(null);
    const [form, setForm] = useState({
        name: "", phone: "", email: "", countryCode: "971",
        status: settings?.statuses?.[0]?.key || "", source: "",
        product: "", value: "", currency: "AED", description: "",
    });

    // Review dialog
    const [reviewLead, setReviewLead] = useState<any>(null);
    const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
    const [reviewNotes, setReviewNotes] = useState("");

    const tabs = isAdmin ? ADMIN_TABS : USER_TABS;

    // ─── Filtered leads ──────────────────────────────────────────────────────
    const filteredLeads = useMemo(() => {
        return leads.filter((lead: any) => {
            if (search) {
                const s = search.toLowerCase();
                if (!lead.name?.toLowerCase().includes(s) &&
                    !lead.phone?.includes(s) &&
                    !lead.email?.toLowerCase().includes(s)) return false;
            }
            if (activeTab !== "all" && lead.submissionStatus !== activeTab) return false;
            if (ownerFilter !== "all" && lead.ownerId?._id !== ownerFilter && lead.ownerId !== ownerFilter) return false;
            return true;
        });
    }, [leads, search, activeTab, ownerFilter]);

    // ─── Group by user for admin approval tab ────────────────────────────────
    const groupedByUser = useMemo(() => {
        if (!isAdmin || activeTab !== "pending") return null;
        const groups: Record<string, { user: any; leads: any[] }> = {};
        filteredLeads.forEach((lead: any) => {
            const uid = lead.ownerId?._id || lead.ownerId || "unknown";
            if (!groups[uid]) {
                groups[uid] = {
                    user: lead.ownerId || { _id: uid, name: "Unknown" },
                    leads: [],
                };
            }
            groups[uid].leads.push(lead);
        });
        return Object.values(groups).sort((a, b) => b.leads.length - a.leads.length);
    }, [filteredLeads, isAdmin, activeTab]);

    // ─── Status label/color resolver using settings ──────────────────────────
    const getStatusConfig = useCallback((key: string) => {
        const s = settings?.statuses?.find((st: any) => st.key === key);
        return s || { label: key?.replace(/_/g, " "), color: "#888888" };
    }, [settings]);

    const sourceLabel = useCallback((key: string) => {
        const s = settings?.sources?.find((src: any) => src.key === key);
        return s?.label || key;
    }, [settings]);

    const productLabel = useCallback((key: string) => {
        const p = settings?.products?.find((pr: any) => pr.key === key);
        return p?.label || key;
    }, [settings]);

    // ─── Toggle collapsed group ──────────────────────────────────────────────
    const toggleGroup = useCallback((uid: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    }, []);

    // ─── Reset form ──────────────────────────────────────────────────────────
    const resetForm = useCallback(() => {
        setForm({
            name: "", phone: "", email: "", countryCode: "971",
            status: settings?.statuses?.[0]?.key || "", source: "",
            product: "", value: "", currency: "AED", description: "",
        });
        setEditLead(null);
    }, [settings]);

    // ─── Create / Update ─────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!form.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        startTransition(async () => {
            const payload = {
                ...form,
                value: form.value ? Number(form.value) : undefined,
            };

            let result;
            if (editLead) {
                result = await updateAdditionalLead(editLead._id, payload);
            } else {
                result = await createAdditionalLead(payload);
            }

            if (result.success) {
                toast({ title: editLead ? "✅ Lead updated" : "✅ Lead created" });
                setFormOpen(false);
                resetForm();
                router.refresh();
            } else {
                toast({ title: result.message, variant: "destructive" });
            }
        });
    }, [form, editLead, toast, resetForm, router]);

    // ─── Delete (Admin only) ─────────────────────────────────────────────────
    const handleDelete = useCallback(async (id: string) => {
        startTransition(async () => {
            const res = await deleteAdditionalLead(id);
            if (res.success) {
                toast({ title: "✅ Lead deleted" });
                setLeads(prev => prev.filter((l: any) => l._id !== id));
            } else {
                toast({ title: res.message, variant: "destructive" });
            }
        });
    }, [toast]);

    // ─── Submit for review ───────────────────────────────────────────────────
    const handleSubmit = useCallback(async (id: string) => {
        startTransition(async () => {
            const res = await submitAdditionalLead(id);
            if (res.success) {
                toast({ title: "✅ Submitted for review" });
                router.refresh();
            } else {
                toast({ title: res.message, variant: "destructive" });
            }
        });
    }, [toast, router]);

    // ─── Admin Review ────────────────────────────────────────────────────────
    const handleReview = useCallback(async () => {
        if (!reviewLead) return;
        startTransition(async () => {
            const res = await reviewAdditionalLead(reviewLead._id, reviewAction, reviewNotes);
            if (res.success) {
                toast({ title: reviewAction === "approve" ? "✅ Lead approved" : "❌ Lead rejected" });
                setReviewLead(null);
                setReviewNotes("");
                router.refresh();
            } else {
                toast({ title: res.message, variant: "destructive" });
            }
        });
    }, [reviewLead, reviewAction, reviewNotes, toast, router]);

    // ─── Bulk approve (for admin grouped view) ──────────────────────────────
    const handleBulkApprove = useCallback(async (leadIds: string[]) => {
        startTransition(async () => {
            let count = 0;
            for (const id of leadIds) {
                const res = await reviewAdditionalLead(id, "approve", "Bulk approved");
                if (res.success) count++;
            }
            toast({ title: `✅ Approved ${count} lead${count > 1 ? "s" : ""}` });
            router.refresh();
        });
    }, [toast, router]);

    // ─── Open edit form ──────────────────────────────────────────────────────
    const openEdit = useCallback((lead: any) => {
        setEditLead(lead);
        setForm({
            name: lead.name || "",
            phone: lead.phone || "",
            email: lead.email || "",
            countryCode: lead.countryCode || "971",
            status: lead.status || "",
            source: lead.source || "",
            product: lead.product || "",
            value: lead.value?.toString() || "",
            currency: lead.currency || "AED",
            description: lead.description || "",
        });
        setFormOpen(true);
    }, []);

    // ─── Render a single lead row (matches leads table style) ────────────────
    const renderLeadRow = useCallback((lead: any) => {
        const subConfig = SUBMISSION_CONFIG[lead.submissionStatus] || SUBMISSION_CONFIG.draft;
        const SubIcon = subConfig.icon;
        const statusCfg = getStatusConfig(lead.status);
        const isOwner = (lead.ownerId?._id || lead.ownerId) === currentUserId;
        const canEdit = !isIQA && ((isOwner && (lead.submissionStatus === "draft" || lead.submissionStatus === "rejected")) || (isAdmin && lead.submissionStatus !== "approved"));
        const canSubmit = !isIQA && isOwner && (lead.submissionStatus === "draft" || lead.submissionStatus === "rejected");
        const canReview = isAdmin && lead.submissionStatus === "pending";
        const canDelete = isAdmin && lead.submissionStatus !== "approved";

        return (
            <TableRow key={lead._id} className="hover:bg-primary/5 transition-colors group">
                {/* Serial */}
                <TableCell className="font-mono text-xs text-primary/60 w-10">
                    #{lead.serialNumber}
                </TableCell>

                {/* Name + Contact */}
                <TableCell>
                    <div className="font-semibold text-sm">{lead.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {lead.phone && <span>{lead.countryCode ? `+${lead.countryCode} ` : ""}{lead.phone}</span>}
                        {lead.phone && lead.email && <span>·</span>}
                        {lead.email && <span>{lead.email}</span>}
                    </div>
                </TableCell>

                {/* Lead Status (from settings, matching leads table style) */}
                <TableCell>
                    <Badge
                        variant="outline"
                        className="text-[11px] h-5 px-1.5 status-chip-dynamic"
                        style={{ '--chip-bg': `${statusCfg.color}15`, '--chip-fg': statusCfg.color, '--chip-border': `${statusCfg.color}50` } as React.CSSProperties}
                    >
                        {statusCfg.label || lead.status}
                    </Badge>
                </TableCell>

                {/* Source */}
                <TableCell className="text-xs text-muted-foreground">
                    {sourceLabel(lead.source) || "—"}
                </TableCell>

                {/* Product */}
                <TableCell className="text-xs text-muted-foreground">
                    {productLabel(lead.product) || "—"}
                </TableCell>

                {/* Submission Status (special colors) */}
                <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1 w-fit", subConfig.color)}>
                        <SubIcon className="h-3 w-3" />
                        {subConfig.label}
                    </Badge>
                    {lead.submissionStatus === "rejected" && lead.reviewNotes && (
                        <div className="text-[10px] text-red-400/70 mt-1 max-w-[200px] truncate" title={lead.reviewNotes}>
                            💬 {lead.reviewNotes}
                        </div>
                    )}
                </TableCell>

                {/* Owner (Admin only) */}
                {isAdmin && (
                    <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {(lead.ownerId?.name || "?")[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium">{lead.ownerId?.name || "Unknown"}</span>
                        </div>
                    </TableCell>
                )}

                {/* Date & Time */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div>{format(new Date(lead.createdAt), "MMM d, yyyy")}</div>
                    <div className="text-[10px] text-muted-foreground/70">{format(new Date(lead.createdAt), "hh:mm a")}</div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl w-48">
                            {canEdit && (
                                <DropdownMenuItem onClick={() => openEdit(lead)} className="cursor-pointer">
                                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                            )}
                            {canSubmit && (
                                <DropdownMenuItem onClick={() => handleSubmit(lead._id)} className="cursor-pointer text-amber-400">
                                    <SendHorizontal className="h-3.5 w-3.5 mr-2" /> Submit to Admin
                                </DropdownMenuItem>
                            )}
                            {canReview && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem
                                        onClick={() => { setReviewLead(lead); setReviewAction("approve"); setReviewNotes(""); }}
                                        className="cursor-pointer text-emerald-400"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => { setReviewLead(lead); setReviewAction("reject"); setReviewNotes(""); }}
                                        className="cursor-pointer text-red-400"
                                    >
                                        <XCircle className="h-3.5 w-3.5 mr-2" /> Reject
                                    </DropdownMenuItem>
                                </>
                            )}
                            {canDelete && (
                                <>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(lead._id)}
                                        className="cursor-pointer text-red-400"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        );
    }, [isAdmin, isIQA, currentUserId, getStatusConfig, sourceLabel, productLabel, openEdit, handleSubmit, handleDelete]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                    { label: "Draft", value: stats.draft, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
                    { label: "Pending", value: stats.pending, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "Approved", value: stats.approved, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Rejected", value: stats.rejected, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                ].map(card => (
                    <div key={card.label} className={cn("p-4 rounded-2xl border text-center transition-all hover:scale-[1.02]", card.bg)}>
                        <div className={cn("text-2xl font-extrabold", card.color)}>{card.value}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const count = tab.key === "all" ? stats.total : stats[tab.key as keyof typeof stats];
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                                activeTab === tab.key
                                    ? "bg-primary/15 text-primary border-primary/30 shadow-sm"
                                    : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                            {typeof count === "number" && count > 0 && (
                                <span className={cn(
                                    "ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                                    activeTab === tab.key ? "bg-primary/25" : "bg-white/10"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 rounded-xl border-white/10 bg-white/5 h-9"
                        />
                    </div>

                    {/* Owner filter (Admin only) */}
                    {isAdmin && (
                        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                            <SelectTrigger className="w-[160px] rounded-xl border-white/10 bg-white/5 h-9 text-xs">
                                <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                <SelectValue placeholder="All Users" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                <SelectItem value="all">All Users</SelectItem>
                                {users.map((u: any) => (
                                    <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Add Lead Button (not for IQA) */}
                {!isIQA && (
                    <Button
                        onClick={() => { resetForm(); setFormOpen(true); }}
                        className="rounded-xl bg-primary hover:bg-primary/80 font-bold shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Lead
                    </Button>
                )}
            </div>

            {/* ─── Admin Pending: Grouped by User ─────────────────────────────── */}
            {isAdmin && activeTab === "pending" && groupedByUser ? (
                <div className="space-y-4">
                    {groupedByUser.length === 0 ? (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl">
                            <CardContent className="py-16 text-center">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-400/30" />
                                <p className="text-sm font-medium text-muted-foreground">No pending leads to review</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">All submissions have been processed</p>
                            </CardContent>
                        </Card>
                    ) : (
                        groupedByUser.map(group => {
                            const uid = group.user?._id || "unknown";
                            const isCollapsed = collapsedGroups.has(uid);
                            return (
                                <Card key={uid} className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                                    {/* Group Header */}
                                    <div
                                        className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={() => toggleGroup(uid)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                                {(group.user?.name || "?")[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-sm">{group.user?.name || "Unknown"}</span>
                                                <span className="ml-2 text-xs text-amber-400 font-medium">{group.leads.length} pending</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleBulkApprove(group.leads.map((l: any) => l._id)); }}
                                            disabled={isPending}
                                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold h-7 px-3"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                            Approve All
                                        </Button>
                                    </div>

                                    {/* Leads list */}
                                    {!isCollapsed && (
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-b border-white/10 bg-white/[0.02]">
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-10">#</TableHead>
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Lead</TableHead>
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Value</TableHead>
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Reason</TableHead>
                                                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Submitted</TableHead>
                                                        <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {group.leads.map((lead: any) => {
                                                        const statusCfg = getStatusConfig(lead.status);
                                                        return (
                                                            <TableRow key={lead._id} className="hover:bg-primary/5 transition-colors">
                                                                <TableCell className="font-mono text-xs text-primary/60">#{lead.serialNumber}</TableCell>
                                                                <TableCell>
                                                                    <div className="font-semibold text-sm">{lead.name}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {lead.phone && <span>{lead.countryCode ? `+${lead.countryCode} ` : ""}{lead.phone}</span>}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="text-[11px] h-5 px-1.5 status-chip-dynamic"
                                                                        style={{ '--chip-bg': `${statusCfg.color}15`, '--chip-fg': statusCfg.color, '--chip-border': `${statusCfg.color}50` } as React.CSSProperties}>
                                                                        {statusCfg.label}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs">{productLabel(lead.product) || "—"}</TableCell>
                                                                <TableCell className="text-xs font-medium">
                                                                    {lead.value ? `${lead.currency} ${Number(lead.value).toLocaleString()}` : "—"}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={lead.description}>
                                                                    {lead.description || "—"}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                                    {lead.submittedAt ? format(new Date(lead.submittedAt), "MMM d, hh:mm a") : "—"}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center gap-1 justify-end">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => { setReviewLead(lead); setReviewAction("approve"); setReviewNotes(""); }}
                                                                            className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/15 rounded-lg"
                                                                            title="Approve"
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => { setReviewLead(lead); setReviewAction("reject"); setReviewNotes(""); }}
                                                                            className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/15 rounded-lg"
                                                                            title="Reject"
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            ) : (
                /* ─── Standard Table View (All / Approved / Rejected tabs) ──── */
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                        {filteredLeads.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <NotebookPen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-medium">
                                    {activeTab === "all" ? "No additional leads found" :
                                     activeTab === "approved" ? "No approved leads yet" :
                                     activeTab === "rejected" ? "No rejected leads" : "No leads in this category"}
                                </p>
                                <p className="text-xs mt-1">
                                    {!isIQA && activeTab === "all" ? 'Click "Add Lead" to create your first lead' : ""}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-white/10 bg-white/[0.02]">
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground w-10">#</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Source</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Product</TableHead>
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Submission</TableHead>
                                            {isAdmin && (
                                                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Owner</TableHead>
                                            )}
                                            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                            <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLeads.map(renderLeadRow)}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Create / Edit Dialog ────────────────────────────────────── */}
            <Dialog open={formOpen} onOpenChange={open => { if (!open) { setFormOpen(false); resetForm(); } }}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <NotebookPen className="h-5 w-5 text-primary" />
                            {editLead ? "Edit Lead" : "Add Additional Lead"}
                        </DialogTitle>
                        <DialogDescription>
                            {editLead ? "Update your personal lead details." : "Add a new lead to your personal collection."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Name *</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Lead name"
                                className="rounded-xl border-white/10 bg-black/20"
                            />
                        </div>

                        {/* Phone + Country Code */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Code</Label>
                                <Input
                                    value={form.countryCode}
                                    onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))}
                                    placeholder="971"
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Phone</Label>
                                <Input
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="Phone number"
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Email</Label>
                            <Input
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="email@example.com"
                                className="rounded-xl border-white/10 bg-black/20"
                            />
                        </div>

                        {/* Status + Source */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Status *</Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        {(settings?.statuses || []).map((s: any) => (
                                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Source</Label>
                                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        {(settings?.sources || []).map((s: any) => (
                                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Product + Value */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Product</Label>
                                <Select value={form.product} onValueChange={v => setForm(f => ({ ...f, product: v }))}>
                                    <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                        <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        {(settings?.products || []).map((p: any) => (
                                            <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Deal Value</Label>
                                <Input
                                    type="number"
                                    value={form.value}
                                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                                    placeholder="0"
                                    className="rounded-xl border-white/10 bg-black/20"
                                />
                            </div>
                        </div>

                        {/* Description / Reason */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Reason / Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Why are you adding this lead? e.g. Cold call conversion, walk-in customer…"
                                className="rounded-xl border-white/10 bg-black/20 min-h-[80px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }} className="rounded-xl border-white/10">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending} className="rounded-xl bg-primary font-bold">
                            {isPending ? "Saving…" : editLead ? "Update Lead" : "Create Lead"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Review Dialog (Admin) ───────────────────────────────────── */}
            <Dialog open={!!reviewLead} onOpenChange={open => { if (!open) setReviewLead(null); }}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {reviewAction === "approve" ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-400" />
                            )}
                            {reviewAction === "approve" ? "Approve Lead" : "Reject Lead"}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewAction === "approve"
                                ? `This will create a real lead from "${reviewLead?.name}" and assign it to the owner.`
                                : `Rejecting "${reviewLead?.name}" — the lead stays in additional leads.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {reviewLead && (
                        <div className="space-y-4">
                            {/* Lead Summary */}
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                                <div><strong>Name:</strong> {reviewLead.name}</div>
                                <div><strong>Phone:</strong> {reviewLead.phone || "—"}</div>
                                <div><strong>Email:</strong> {reviewLead.email || "—"}</div>
                                <div><strong>Status:</strong> {getStatusConfig(reviewLead.status).label}</div>
                                <div><strong>Product:</strong> {productLabel(reviewLead.product) || "—"}</div>
                                <div><strong>Owner:</strong> {reviewLead.ownerId?.name || "Unknown"}</div>
                                {reviewLead.description && (
                                    <div><strong>Reason:</strong> {reviewLead.description}</div>
                                )}
                            </div>

                            {/* Review Notes */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <MessageSquare className="h-3 w-3" />
                                    {reviewAction === "approve" ? "Notes (optional)" : "Rejection reason"}
                                </Label>
                                <Textarea
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    placeholder={reviewAction === "approve" ? "Optional notes…" : "Why is this lead rejected?"}
                                    className="rounded-xl border-white/10 bg-black/20 min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewLead(null)} className="rounded-xl border-white/10">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReview}
                            disabled={isPending}
                            className={cn(
                                "rounded-xl font-bold",
                                reviewAction === "approve"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {isPending ? "Processing…" : reviewAction === "approve" ? "Approve & Create Lead" : "Reject Lead"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
