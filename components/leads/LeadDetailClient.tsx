"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Tag, Star, StarOff,
    Calendar, Clock, MessageSquare, PhoneCall, Video, Send, Users, MoreHorizontal,
    Plus, CheckCircle2, XCircle, AlertCircle, Briefcase, DollarSign, Hash,
    ChevronDown, Sparkles, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateLeadStatus, addNote, addLeadAction, toggleStarLead } from "@/lib/actions/leads";
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
    userRole: string;
    userId: string;
}

export default function LeadDetailClient({ lead, notes, actions, statuses, sources, userRole, userId }: LeadDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // Timeline: merge notes + actions sorted by date
    const timeline = [
        ...notes.map(n => ({ ...n, kind: "note" as const })),
        ...actions.map(a => ({ ...a, kind: "action" as const, message: a.description, type: a.type })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Note form
    const [noteText, setNoteText] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);

    // Action form
    const [actionForm, setActionForm] = useState({ type: "CALL", description: "", outcome: "" });
    const [isAddingAction, setIsAddingAction] = useState(false);

    // Status
    const [currentStatus, setCurrentStatus] = useState(lead.status);

    const handleStatusChange = async (newStatus: string) => {
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
    };

    const handleAddNote = async () => {
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
    };

    const handleAddAction = async () => {
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
    };

    const handleToggleStar = async () => {
        startTransition(async () => {
            await toggleStarLead(lead._id);
            router.refresh();
        });
    };

    const isStarred = (lead.starred || []).includes(userId);
    const assignedName = lead.assignedTo?.name || "Unassigned";

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    };

    const timeAgo = (dateStr: string) => {
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
    };

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
                        <Select value={currentStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger className={cn("w-[140px] rounded-full border font-semibold text-xs h-8", STATUS_COLORS[currentStatus] || "bg-primary/15 text-primary border-primary/30")}>
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
                    <h1 className="text-3xl font-extrabold tracking-tight">{lead.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {lead.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {lead.company}</span>}
                        {lead.position && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {lead.position}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {assignedName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created {formatDate(lead.createdAt)}</span>
                    </div>
                </div>
            </FadeIn>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Profile Card */}
                <FadeIn delay={0.1} className="lg:col-span-1 space-y-6">
                    {/* Contact Info */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Hash className="h-4 w-4 text-primary" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {lead.phone && (
                                <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Phone className="h-4 w-4 text-emerald-400" /></div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Phone</div>
                                        <div className="text-sm font-medium group-hover:text-primary transition-colors">{lead.phone}</div>
                                    </div>
                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                            {lead.email && (
                                <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center"><Mail className="h-4 w-4 text-blue-400" /></div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Email</div>
                                        <div className="text-sm font-medium group-hover:text-primary transition-colors">{lead.email}</div>
                                    </div>
                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                            {lead.website && (
                                <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><Globe className="h-4 w-4 text-purple-400" /></div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Website</div>
                                        <div className="text-sm font-medium group-hover:text-primary transition-colors truncate max-w-[180px]">{lead.website}</div>
                                    </div>
                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                            {lead.phone && (
                                <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="h-8 w-8 rounded-lg bg-green-500/15 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-green-400" /></div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">WhatsApp</div>
                                        <div className="text-sm font-medium group-hover:text-primary transition-colors">Send Message</div>
                                    </div>
                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                            {(lead.address?.city || lead.address?.country) && (
                                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                                    <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center"><MapPin className="h-4 w-4 text-amber-400" /></div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Location</div>
                                        <div className="text-sm font-medium">
                                            {[lead.address?.addressLine, lead.address?.city, lead.address?.state, lead.address?.country].filter(Boolean).join(", ")}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deal Info */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Deal Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(lead.value !== undefined && lead.value !== null) && (
                                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                    <span className="text-xs text-muted-foreground">Value</span>
                                    <span className="text-sm font-bold text-emerald-400">{lead.currency} {Number(lead.value).toLocaleString()}</span>
                                </div>
                            )}
                            {lead.source && (
                                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                    <span className="text-xs text-muted-foreground">Source</span>
                                    <Badge variant="outline" className="rounded-full text-xs border-white/10">{lead.source}</Badge>
                                </div>
                            )}
                            {lead.product && (
                                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                    <span className="text-xs text-muted-foreground">Product</span>
                                    <span className="text-sm font-medium">{lead.product}</span>
                                </div>
                            )}
                            {lead.lastContactAt && (
                                <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                    <span className="text-xs text-muted-foreground">Last Contact</span>
                                    <span className="text-sm font-medium">{formatDate(lead.lastContactAt)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

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

                    {/* Activity Timeline */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Activity Timeline
                                <Badge variant="outline" className="ml-auto rounded-full text-[10px] border-white/10">{timeline.length} events</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No activity yet</p>
                                    <p className="text-xs mt-1">Add a note or log an action to get started</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5" />

                                    <div className="space-y-1">
                                        {timeline.map((item, i) => (
                                            <div key={item._id} className="relative flex gap-3 py-3 group">
                                                {/* Icon */}
                                                <div className={cn(
                                                    "relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background transition-all",
                                                    getTimelineColor(item.kind, item.type)
                                                )}>
                                                    {getTimelineIcon(item.kind, item.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                    {item.kind === "action" ? item.type.replace("_", " ") : item.type.replace("_", " ")}
                                                                </span>
                                                                {item.kind === "action" && (
                                                                    <Badge variant="outline" className="text-[9px] rounded-full border-white/10 px-1.5 h-4">Action</Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm">{item.message || item.description}</p>
                                                            {item.outcome && (
                                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                                    Outcome: {item.outcome}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-1">
                                                            {timeAgo(item.createdAt)}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                        by {item.authorName || (item.authorId?.name) || "System"} · {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </FadeIn>
            </div>
        </div>
    );
}
