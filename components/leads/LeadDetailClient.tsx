"use client";

import React, { useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Building2, Phone, Star, StarOff,
    Calendar, Clock, MessageSquare, PhoneCall, Video, Send, Users, MoreHorizontal,
    Plus, AlertCircle, Briefcase, Tag,
    Sparkles, Pencil, Trash2, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/constants/countryCodes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { updateLeadStatus, addNote, addLeadAction, toggleStarLead, deleteLead } from "@/lib/actions/leads";
import { updateLead } from "@/lib/actions/leads";
import { LeadContactCard } from "./LeadContactCard";
import { LeadDealCard } from "./LeadDealCard";
import { LeadTimeline } from "./LeadTimeline";
import { LeadEditDialog } from "./LeadEditDialog";
import { FadeIn } from "@/components/dashboard/DashboardAnimations";

// Action type options
const ACTION_TYPES = [
    { value: "CALL", label: "Phone Call", icon: PhoneCall },
    { value: "MEETING", label: "Meeting", icon: Video },
    { value: "EMAIL", label: "Email", icon: Send },
    { value: "FOLLOW_UP", label: "Follow Up", icon: Clock },
    { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
    { value: "OTHER", label: "Other", icon: MoreHorizontal },
];

const STATUS_COLORS: Record<string, string> = {
    "New": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    "Contacted": "bg-amber-500/15 text-amber-400 border-amber-500/30",
    "Qualified": "bg-purple-500/15 text-purple-400 border-purple-500/30",
    "Proposal": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    "Won": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    "Lost": "bg-red-500/15 text-red-400 border-red-500/30",
};

function getTimelineIcon(kind: string, type: string) {
    if (kind === "note") {
        switch (type) {
            case "STATUS_CHANGE": return <AlertCircle className="h-4 w-4" />;
            case "PHONE_UPDATE": return <Phone className="h-4 w-4" />;
            case "SYSTEM": return <Sparkles className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    }
    // action
    switch (type) {
        case "CALL": return <PhoneCall className="h-4 w-4" />;
        case "MEETING": return <Video className="h-4 w-4" />;
        case "EMAIL": return <Send className="h-4 w-4" />;
        case "FOLLOW_UP": return <Clock className="h-4 w-4" />;
        case "WHATSAPP": return <MessageSquare className="h-4 w-4" />;
        default: return <MoreHorizontal className="h-4 w-4" />;
    }
}

function getTimelineColor(kind: string, type: string) {
    if (kind === "note") {
        switch (type) {
            case "STATUS_CHANGE": return "text-amber-400 bg-amber-500/15";
            case "PHONE_UPDATE": return "text-blue-400 bg-blue-500/15";
            case "SYSTEM": return "text-purple-400 bg-purple-500/15";
            default: return "text-primary bg-primary/15";
        }
    }
    switch (type) {
        case "CALL": return "text-emerald-400 bg-emerald-500/15";
        case "MEETING": return "text-cyan-400 bg-cyan-500/15";
        case "EMAIL": return "text-blue-400 bg-blue-500/15";
        case "FOLLOW_UP": return "text-amber-400 bg-amber-500/15";
        case "WHATSAPP": return "text-green-400 bg-green-500/15";
        default: return "text-gray-400 bg-gray-500/15";
    }
}

interface LeadDetailClientProps {
    lead: any;
    notes: any[];
    actions: any[];
    statuses: string[];
    sources: string[];
    settings?: any;
    users?: any[];
    userRole: string;
    userId: string;
}

export default function LeadDetailClient({ lead, notes, actions, statuses, sources, settings, users, userRole, userId }: LeadDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // Timeline: merge notes + actions sorted by date (memoized — expensive sort)
    const timeline = useMemo(() => [
        ...notes.map(n => ({ ...n, kind: "note" as const })),
        ...actions.map(a => ({ ...a, kind: "action" as const, message: a.description, type: a.type })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notes, actions]);

    // Note form
    const [noteText, setNoteText] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Action form
    const [actionForm, setActionForm] = useState({ type: "CALL", description: "", outcome: "" });
    const [isAddingAction, setIsAddingAction] = useState(false);

    // Status
    const [currentStatus, setCurrentStatus] = useState(lead.status);

    // Build a color map from settings (memoized)
    const statusColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        (settings?.statuses || []).forEach((s: any) => {
            if (s.color) map[s.key] = s.color;
        });
        return map;
    }, [settings?.statuses]);
    const getStatusChipClass = useCallback((status: string) => STATUS_COLORS[status] || "bg-primary/15 text-primary border-primary/30", []);
    const getStatusChipStyle = useCallback((status: string): React.CSSProperties => {
        const hex = statusColorMap[status];
        return hex ? { '--chip-bg': `${hex}25`, '--chip-fg': hex, '--chip-border': `${hex}50` } as React.CSSProperties : {};
    }, [statusColorMap]);

    // Edit dialog
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        name: lead.name || "",
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || "",
        product: lead.product || "",
        value: lead.value?.toString() || "",
        description: lead.description || "",
        tags: (lead.tags || []).join(", "),
    });

    // Delete confirmation
    const [showDelete, setShowDelete] = useState(false);

    const handleStatusChange = useCallback(async (newStatus: string) => {
        setCurrentStatus(newStatus);
        startTransition(async () => {
            const result = await updateLeadStatus(lead._id, newStatus);
            if (result?.success) {
                toast({ title: `Status changed to ${newStatus}` });
                router.refresh();
            } else {
                setCurrentStatus(lead.status);
                toast({ title: result?.message || "Error", variant: "destructive" });
            }
        });
    }, [lead._id, lead.status, toast, router, startTransition]);

    const handleAddNote = useCallback(async () => {
        if (!noteText.trim()) return;
        startTransition(async () => {
            const result = await addNote(lead._id, noteText.trim());
            if (result?.success) {
                toast({ title: "Note added" });
                setNoteText("");
                setIsAddingNote(false);
                router.refresh();
            } else {
                toast({ title: result?.message || "Error", variant: "destructive" });
            }
        });
    }, [lead._id, noteText, toast, router, startTransition]);

    const handleAddAction = useCallback(async () => {
        if (!actionForm.description.trim()) return;
        startTransition(async () => {
            const result = await addLeadAction(lead._id, {
                type: actionForm.type,
                description: actionForm.description.trim(),
                outcome: actionForm.outcome.trim() || undefined,
            });
            if (result?.success) {
                toast({ title: "Action logged" });
                setActionForm({ type: "CALL", description: "", outcome: "" });
                setIsAddingAction(false);
                router.refresh();
            } else {
                toast({ title: result?.message || "Error", variant: "destructive" });
            }
        });
    }, [lead._id, actionForm, toast, router, startTransition]);

    const handleToggleStar = useCallback(async () => {
        startTransition(async () => {
            await toggleStarLead(lead._id);
            router.refresh();
        });
    }, [lead._id, router, startTransition]);

    const handleEditSave = useCallback(async () => {
        const formData = new FormData();
        formData.set("id", lead._id);
        formData.set("name", editForm.name);
        formData.set("company", editForm.company);
        formData.set("email", editForm.email);
        formData.set("phone", editForm.phone);
        formData.set("source", editForm.source);
        formData.set("product", editForm.product);
        formData.set("value", editForm.value);
        formData.set("description", editForm.description);
        formData.set("tags", editForm.tags);
        formData.set("status", currentStatus);
        startTransition(async () => {
            const result = await updateLead(null, formData);
            if (result?.success) {
                toast({ title: "Lead updated" });
                setShowEdit(false);
                router.refresh();
            } else {
                toast({ title: result?.message || "Error", variant: "destructive" });
            }
        });
    }, [lead._id, editForm, currentStatus, toast, router, startTransition]);

    const handleDelete = useCallback(async () => {
        startTransition(async () => {
            const result = await deleteLead(lead._id);
            if (result?.success) {
                toast({ title: "Lead moved to trash" });
                router.push("/leads");
            } else {
                toast({ title: result?.message || "Error", variant: "destructive" });
            }
        });
    }, [lead._id, toast, router, startTransition]);

    const isStarred = useMemo(() => (lead.starred || []).includes(userId), [lead.starred, userId]);
    const assignedName = lead.assignedTo?.name || "Unassigned";

    const handleExport = useCallback(() => {
        const data = {
            Name: lead.name,
            Company: lead.company || "",
            Phone: lead.phone || "",
            Email: lead.email || "",
            Status: currentStatus,
            Source: lead.source || "",
            Product: lead.product || "",
            Value: lead.value ? `${lead.currency} ${lead.value}` : "",
            Tags: (lead.tags || []).join(", "),
            Description: lead.description || "",
            "Assigned To": assignedName,
            Created: formatDate(lead.createdAt),
        };
        const csv = Object.entries(data).map(([k, v]) => `${k},"${String(v).replace(/"/g, '""')}"`).join("\n");
        const blob = new Blob(["Field,Value\n" + csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lead.name.replace(/\s+/g, "_")}_lead.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Lead exported as CSV" });
    }, [lead, currentStatus, assignedName, toast]);

    const formatDate = useCallback((dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }, []);

    const formatTime = useCallback((dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }, []);

    const timeAgo = useCallback((dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return formatDate(dateStr);
    }, [formatDate]);

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <FadeIn delay={0}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link href="/leads" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Leads
                    </Link>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleToggleStar} disabled={isPending}>
                            {isStarred ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : <StarOff className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-white/10 gap-1.5" onClick={() => setShowEdit(true)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-white/10 gap-1.5" onClick={handleExport}>
                            <Download className="h-3.5 w-3.5" /> Export
                        </Button>
                        <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10 gap-1.5">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete <strong>{lead.name}</strong>? This will move the lead to trash. You can restore it later from the recycle bin.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={isPending}>
                                        {isPending ? "Deleting..." : "Delete Lead"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Select value={currentStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger
                                className={cn("w-[140px] rounded-full border font-semibold text-xs h-8 status-chip-dynamic", !statusColorMap[currentStatus] && (STATUS_COLORS[currentStatus] || "bg-primary/15 text-primary border-primary/30"))}
                                style={getStatusChipStyle(currentStatus)}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </FadeIn>

            {/* Lead Name & Meta */}
            <FadeIn delay={0.05}>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold tracking-tight">{lead.name}</h1>
                        {lead.serialNumber && (
                            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary/80 px-2 py-0.5 rounded-lg">LM-{lead.serialNumber}</Badge>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {lead.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {lead.company}</span>}
                        {lead.position && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {lead.position}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {assignedName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {formatDate(lead.createdAt)}</span>
                        {lead.createdBy?.name && <span className="text-xs text-muted-foreground/60">by {lead.createdBy.name}</span>}
                    </div>
                </div>
            </FadeIn>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Profile Card */}
                <FadeIn delay={0.1} className="lg:col-span-1 space-y-6">
                    <LeadContactCard lead={lead} />

                    <LeadDealCard lead={lead} formatDate={formatDate} />

                    {/* Tags */}
                    {lead.tags && lead.tags.length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5">
                                    {lead.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline" className="rounded-full text-xs bg-primary/10 border-primary/20 text-primary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Description */}
                    {lead.description && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Custom Fields */}
                    {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold">Custom Fields</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {Object.entries(lead.customFields).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                        <span className="text-xs text-muted-foreground capitalize">{key}</span>
                                        <span className="text-sm font-medium">{String(value)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </FadeIn>

                {/* Right: Timeline & Actions */}
                <FadeIn delay={0.15} className="lg:col-span-2 space-y-6">
                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="rounded-full border-white/10 bg-card/40 backdrop-blur-xl gap-1.5 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                            onClick={() => setIsAddingNote(!isAddingNote)}
                        >
                            <MessageSquare className="h-4 w-4" /> Add Note
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full border-white/10 bg-card/40 backdrop-blur-xl gap-1.5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                            onClick={() => setIsAddingAction(!isAddingAction)}
                        >
                            <Plus className="h-4 w-4" /> Log Action
                        </Button>
                        {lead.phone && (
                            <a href={`tel:${lead.phone}`}>
                                <Button variant="outline" className="rounded-full border-white/10 bg-card/40 backdrop-blur-xl gap-1.5 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all">
                                    <PhoneCall className="h-4 w-4" /> Call
                                </Button>
                            </a>
                        )}
                        {lead.phone && (
                            <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="rounded-full border-white/10 bg-card/40 backdrop-blur-xl gap-1.5 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400 transition-all">
                                    <MessageSquare className="h-4 w-4" /> WhatsApp
                                </Button>
                            </a>
                        )}
                    </div>

                    {/* Add Note Form */}
                    {isAddingNote && (
                        <Card className="rounded-3xl border-primary/20 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardContent className="pt-6 space-y-3">
                                <Textarea
                                    placeholder="Write a note about this lead..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    className="rounded-xl border-white/10 bg-black/20 min-h-[80px] resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => { setIsAddingNote(false); setNoteText(""); }}>Cancel</Button>
                                    <Button size="sm" className="rounded-full bg-primary hover:bg-primary/80" onClick={handleAddNote} disabled={!noteText.trim() || isPending}>
                                        {isPending ? "Saving..." : "Add Note"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Add Action Form */}
                    {isAddingAction && (
                        <Card className="rounded-3xl border-emerald-500/20 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                            <CardContent className="pt-6 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">Action Type</label>
                                        <Select value={actionForm.type} onValueChange={(v) => setActionForm({ ...actionForm, type: v })}>
                                            <SelectTrigger className="rounded-xl border-white/10 bg-black/20"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                {ACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">Outcome (optional)</label>
                                        <Input
                                            placeholder="e.g. Interested, Follow up next week"
                                            value={actionForm.outcome}
                                            onChange={(e) => setActionForm({ ...actionForm, outcome: e.target.value })}
                                            className="rounded-xl border-white/10 bg-black/20"
                                        />
                                    </div>
                                </div>
                                <Textarea
                                    placeholder="Describe what happened..."
                                    value={actionForm.description}
                                    onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                                    className="rounded-xl border-white/10 bg-black/20 min-h-[80px] resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" className="rounded-full" onClick={() => { setIsAddingAction(false); setActionForm({ type: "CALL", description: "", outcome: "" }); }}>Cancel</Button>
                                    <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={handleAddAction} disabled={!actionForm.description.trim() || isPending}>
                                        {isPending ? "Saving..." : "Log Action"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <LeadTimeline
                        timeline={timeline}
                        getTimelineIcon={getTimelineIcon}
                        getTimelineColor={getTimelineColor}
                        timeAgo={timeAgo}
                        formatDate={formatDate}
                        formatTime={formatTime}
                    />
                </FadeIn>
            </div>

            <LeadEditDialog
                open={showEdit}
                onOpenChange={setShowEdit}
                editForm={editForm}
                setEditForm={setEditForm}
                sources={sources}
                onSave={handleEditSave}
                isPending={isPending}
            />
        </div>
    );
}
