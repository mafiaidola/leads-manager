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
    Plus, Search, MoreHorizontal, Pencil, Trash2, SendHorizontal,
    CheckCircle2, XCircle, Clock, FileText, Users, NotebookPen,
    Eye, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    createAdditionalLead, updateAdditionalLead, deleteAdditionalLead,
    submitAdditionalLead, reviewAdditionalLead, getAdditionalLeads,
} from "@/lib/actions/additionalLeads";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: FileText },
    pending: { label: "Pending Review", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock },
    approved: { label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle },
};

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
    const [statusFilter, setStatusFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");
    const isIQA = currentUserRole === "IQA";

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

    // ─── Filtered leads ──────────────────────────────────────────────────────
    const filteredLeads = useMemo(() => {
        return leads.filter((lead: any) => {
            if (search) {
                const s = search.toLowerCase();
                if (!lead.name?.toLowerCase().includes(s) &&
                    !lead.phone?.includes(s) &&
                    !lead.email?.toLowerCase().includes(s)) return false;
            }
            if (statusFilter !== "all" && lead.submissionStatus !== statusFilter) return false;
            if (ownerFilter !== "all" && lead.ownerId?._id !== ownerFilter && lead.ownerId !== ownerFilter) return false;
            return true;
        });
    }, [leads, search, statusFilter, ownerFilter]);

    // ─── Status label resolver ───────────────────────────────────────────────
    const statusLabel = useCallback((key: string) => {
        const s = settings?.statuses?.find((st: any) => st.key === key);
        return s?.label || key?.replace(/_/g, " ");
    }, [settings]);

    const sourceLabel = useCallback((key: string) => {
        const s = settings?.sources?.find((src: any) => src.key === key);
        return s?.label || key;
    }, [settings]);

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

    // ─── Delete ──────────────────────────────────────────────────────────────
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

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Total", value: stats.total, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                    { label: "Draft", value: stats.draft, color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" },
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

                    {/* Status filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] rounded-xl border-white/10 bg-white/5 h-9 text-xs">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

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

            {/* Leads Table */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardContent className="p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <NotebookPen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No additional leads found</p>
                            <p className="text-xs mt-1">
                                {!isIQA ? "Click \"Add Lead\" to create your first personal lead" : "No leads to display"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">#</th>
                                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lead</th>
                                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Source</th>
                                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Submission</th>
                                        {isAdmin && (
                                            <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Owner</th>
                                        )}
                                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                                        <th className="text-right p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead: any, idx: number) => {
                                        const subConfig = STATUS_CONFIG[lead.submissionStatus] || STATUS_CONFIG.draft;
                                        const SubIcon = subConfig.icon;
                                        const isOwner = (lead.ownerId?._id || lead.ownerId) === currentUserId;
                                        const canEdit = !isIQA && (isOwner && (lead.submissionStatus === "draft" || lead.submissionStatus === "rejected")) || (isAdmin && lead.submissionStatus !== "approved");
                                        const canSubmit = !isIQA && isOwner && (lead.submissionStatus === "draft" || lead.submissionStatus === "rejected");
                                        const canReview = isAdmin && lead.submissionStatus === "pending";
                                        const canDelete = !isIQA && (isOwner || isAdmin) && lead.submissionStatus !== "approved";

                                        return (
                                            <tr key={lead._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-3 text-muted-foreground text-xs font-mono">{lead.serialNumber}</td>
                                                <td className="p-3">
                                                    <div className="font-medium">{lead.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {lead.phone && <span>{lead.countryCode ? `+${lead.countryCode} ` : ""}{lead.phone}</span>}
                                                        {lead.phone && lead.email && <span className="mx-1">·</span>}
                                                        {lead.email && <span>{lead.email}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline" className="text-[10px] border-white/20">
                                                        {statusLabel(lead.status)}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    {sourceLabel(lead.source) || "—"}
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1 w-fit", subConfig.color)}>
                                                        <SubIcon className="h-3 w-3" />
                                                        {subConfig.label}
                                                    </Badge>
                                                    {lead.submissionStatus === "rejected" && lead.reviewNotes && (
                                                        <div className="text-[10px] text-red-400/70 mt-1 max-w-[200px] truncate" title={lead.reviewNotes}>
                                                            💬 {lead.reviewNotes}
                                                        </div>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="p-3 text-xs">
                                                        <span className="font-medium">{lead.ownerId?.name || "Unknown"}</span>
                                                    </td>
                                                )}
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    {new Date(lead.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
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
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ─── Create / Edit Dialog ────────────────────────────────────────── */}
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

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Notes about this lead…"
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

            {/* ─── Review Dialog (Admin) ───────────────────────────────────────── */}
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
                                : `Rejecting "${reviewLead?.name}" — the lead stays with the user.`
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
                                <div><strong>Status:</strong> {statusLabel(reviewLead.status)}</div>
                                <div><strong>Owner:</strong> {reviewLead.ownerId?.name || "Unknown"}</div>
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
