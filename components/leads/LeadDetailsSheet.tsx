"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useEffect, useState, useTransition } from "react";
import { getLeadDetails, addNote, updateLeadStatus, addLeadAction } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
    Phone,
    Mail,
    Globe,
    MapPin,
    Building2,
    User,
    StickyNote,
    History,
    Info,
    MessageSquare,
    Globe2,
    Languages,
    MapPinned,
    ExternalLink,
    PhoneCall,
    Video,
    AtSign,
    Clock,
    MessageCircle,
    Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeadDetailsSheetProps {
    leadId: string | null;
    onClose: () => void;
    currentUserRole: string;
    settings: any;
}

const ACTION_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    CALL: { label: "Call", icon: PhoneCall, color: "text-green-500" },
    MEETING: { label: "Meeting", icon: Video, color: "text-blue-500" },
    EMAIL: { label: "Email", icon: AtSign, color: "text-purple-500" },
    FOLLOW_UP: { label: "Follow Up", icon: Clock, color: "text-amber-500" },
    WHATSAPP: { label: "WhatsApp", icon: MessageCircle, color: "text-emerald-500" },
    OTHER: { label: "Other", icon: Zap, color: "text-gray-400" },
};

export function LeadDetailsSheet({ leadId, onClose, currentUserRole, settings }: LeadDetailsSheetProps) {
    const [data, setData] = useState<any>(null);
    const [note, setNote] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Actions form state
    const [actionType, setActionType] = useState("CALL");
    const [actionDesc, setActionDesc] = useState("");
    const [actionOutcome, setActionOutcome] = useState("");

    const isMarketing = currentUserRole === "MARKETING";
    const canEdit = !isMarketing; // Admin + Sales can add notes, change status, add actions

    useEffect(() => {
        if (leadId) {
            startTransition(async () => {
                const result = await getLeadDetails(leadId);
                setData(result);
            });
        } else {
            setData(null);
        }
    }, [leadId]);

    const handleAddNote = async () => {
        if (!note.trim() || !leadId) return;
        await addNote(leadId, note);
        setNote("");
        toast({ title: "Note added" });
        const result = await getLeadDetails(leadId);
        setData(result);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!leadId) return;
        await updateLeadStatus(leadId, newStatus);
        toast({ title: "Status updated" });
        const result = await getLeadDetails(leadId);
        setData(result);
    };

    const handleAddAction = async () => {
        if (!actionDesc.trim() || !leadId) return;
        const result = await addLeadAction(leadId, {
            type: actionType,
            description: actionDesc,
            outcome: actionOutcome || undefined,
        });
        if (result?.success) {
            toast({ title: "Action logged" });
            setActionDesc("");
            setActionOutcome("");
            setActionType("CALL");
            const updated = await getLeadDetails(leadId);
            setData(updated);
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    };

    if (!leadId) return null;

    return (
        <Sheet open={!!leadId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[600px] overflow-hidden flex flex-col p-0 border-white/10 bg-card/95 backdrop-blur-xl">
                <div className="p-6 pb-0">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Lead Details
                            </SheetTitle>
                            {data?.lead?.status && (
                                <Badge
                                    className="rounded-full px-3"
                                    style={{
                                        backgroundColor: settings?.statuses.find((s: any) => s.key === data.lead.status)?.color + '20',
                                        color: settings?.statuses.find((s: any) => s.key === data.lead.status)?.color,
                                        borderColor: settings?.statuses.find((s: any) => s.key === data.lead.status)?.color,
                                        borderWidth: '1px'
                                    }}
                                >
                                    {settings?.statuses.find((s: any) => s.key === data.lead.status)?.label || data.lead.status}
                                </Badge>
                            )}
                        </div>
                        <SheetDescription>
                            {isMarketing ? "View lead information (read-only)." : "Manage and track interaction with this lead."}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {data ? (
                    <Tabs defaultValue="profile" className="flex-1 flex flex-col mt-4">
                        <div className="px-6">
                            <TabsList className="grid w-full grid-cols-4 bg-white/5 rounded-xl p-1">
                                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                                    <User className="h-4 w-4 mr-1" />
                                    Profile
                                </TabsTrigger>
                                <TabsTrigger value="notes" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Notes
                                </TabsTrigger>
                                <TabsTrigger value="actions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                                    <Zap className="h-4 w-4 mr-1" />
                                    Actions
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-xs">
                                    <History className="h-4 w-4 mr-1" />
                                    Log
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-6 mt-4">
                            {/* ─── PROFILE TAB ─── */}
                            <TabsContent value="profile" className="mt-0 space-y-6 pb-8">
                                {/* Header Info */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <h2 className="text-xl font-bold text-foreground">{data.lead.name}</h2>
                                    <p className="text-sm text-primary font-medium">{data.lead.position || "Contact Person"}</p>
                                    <div className="flex items-center space-x-2 text-muted-foreground mt-2">
                                        <Building2 className="h-4 w-4" />
                                        <span className="text-sm">{data.lead.company || "No Company"}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {data.lead.tags?.map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Actions / Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Current Status</label>
                                        {canEdit ? (
                                            <Select onValueChange={handleStatusChange} value={data.lead.status}>
                                                <SelectTrigger className="rounded-xl bg-white/5 border-white/10 h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                    {settings?.statuses.map((s: any) => (
                                                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex items-center h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                                                {settings?.statuses.find((s: any) => s.key === data.lead.status)?.label || data.lead.status}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Assigned To</label>
                                        <div className="flex items-center h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                                            <User className="h-3.5 w-3.5 mr-2 text-primary" />
                                            {data.lead.assignedTo?.name || "Unassigned"}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-white/5" />

                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" />
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {data.lead.email ? (
                                            <a href={`mailto:${data.lead.email}`} className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 text-blue-500">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</span>
                                                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{data.lead.email}</span>
                                                </div>
                                                <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 text-blue-500">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</span>
                                                    <span className="text-sm font-medium text-muted-foreground">No Email</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mr-3 text-green-500">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Phone Number</span>
                                                    <span className="text-sm font-medium">{data.lead.phone || "No Phone"}</span>
                                                </div>
                                            </div>
                                            {data.lead.phone && (
                                                <a
                                                    href={`https://wa.me/${data.lead.phone?.replace(/[^0-9]/g, "")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-8 px-3 rounded-lg bg-green-500 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-green-600 transition-colors"
                                                >
                                                    WhatsApp
                                                </a>
                                            )}
                                        </div>

                                        {data.lead.website ? (
                                            <a href={data.lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mr-3 text-purple-500">
                                                    <Globe className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Website / URL</span>
                                                    <span className="text-sm font-medium truncate max-w-[250px]">{data.lead.website}</span>
                                                </div>
                                                <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mr-3 text-purple-500">
                                                    <Globe className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Website / URL</span>
                                                    <span className="text-sm font-medium text-muted-foreground">No Website</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Location Details */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                        <MapPinned className="h-3.5 w-3.5" />
                                        Location & Preferences
                                    </h3>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                        <div className="flex items-start">
                                            <MapPin className="h-4 w-4 mr-3 mt-1 text-primary/60" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{data.lead.address?.addressLine || "No Address Line"}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {[data.lead.address?.city, data.lead.address?.state, data.lead.address?.country].filter(Boolean).join(", ") || "No location details"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="flex items-center text-xs">
                                                <Languages className="h-3.5 w-3.5 mr-2 text-primary/60" />
                                                <span className="text-muted-foreground mr-1">Language:</span>
                                                <span className="font-semibold">{data.lead.defaultLanguage || "English"}</span>
                                            </div>
                                            <div className="flex items-center text-xs">
                                                <Globe2 className="h-3.5 w-3.5 mr-2 text-primary/60" />
                                                <span className="text-muted-foreground mr-1">Visibility:</span>
                                                <Badge variant="outline" className="text-[10px] h-5 py-0 border-white/10 uppercase">
                                                    {data.lead.public ? "Public" : "Private"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {data.lead.description && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">Description</h3>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{data.lead.description}</p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ─── NOTES TAB ─── */}
                            <TabsContent value="notes" className="mt-0 space-y-6 pb-8">
                                <div className="space-y-4">
                                    {canEdit && (
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                            <h3 className="text-sm font-bold flex items-center gap-2">
                                                <StickyNote className="h-4 w-4 text-primary" />
                                                Add New Note
                                            </h3>
                                            <Textarea
                                                placeholder="Type your interaction notes here..."
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                className="bg-white/5 border-white/10 rounded-xl min-h-[100px] resize-none focus:ring-primary/20"
                                            />
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleAddNote}
                                                    disabled={!note.trim()}
                                                    className="rounded-xl shadow-lg shadow-primary/10"
                                                >
                                                    Save Note
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {isMarketing && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                            <p className="text-xs text-amber-500 font-medium">Marketing users can view notes but cannot add new ones.</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                            Interaction History
                                            <Badge variant="outline" className="text-[10px] border-white/10">
                                                {data.notes.filter((n: any) => n.type !== 'SYSTEM').length} Notes
                                            </Badge>
                                        </h3>
                                        {data.notes.filter((n: any) => n.type !== 'SYSTEM').length > 0 ? (
                                            data.notes.filter((n: any) => n.type !== 'SYSTEM').map((n: any) => (
                                                <div key={n._id} className="relative pl-6 pb-6 border-l border-white/10 last:pb-0">
                                                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                    {n.authorId?.name?.charAt(0) || "S"}
                                                                </div>
                                                                <span className="text-xs font-bold">{n.authorId?.name || "System"}</span>
                                                                <Badge variant="outline" className="text-[8px] h-4 uppercase">{n.authorRole}</Badge>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">{format(new Date(n.createdAt), "MMM d, h:mm a")}</span>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{n.message}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-muted-foreground text-sm italic">
                                                No interaction notes recorded yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ─── ACTIONS TAB (Timeline) ─── */}
                            <TabsContent value="actions" className="mt-0 space-y-6 pb-8">
                                {canEdit && (
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-primary" />
                                            Log New Action
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                                                <Select value={actionType} onValueChange={setActionType}>
                                                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                        {Object.entries(ACTION_TYPE_CONFIG).map(([key, cfg]) => (
                                                            <SelectItem key={key} value={key}>
                                                                <span className="flex items-center gap-2">
                                                                    <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                                                    {cfg.label}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outcome</label>
                                                <Input
                                                    placeholder="e.g. Interested, No answer"
                                                    value={actionOutcome}
                                                    onChange={(e) => setActionOutcome(e.target.value)}
                                                    className="rounded-xl bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>
                                        <Textarea
                                            placeholder="Describe the interaction..."
                                            value={actionDesc}
                                            onChange={(e) => setActionDesc(e.target.value)}
                                            className="bg-white/5 border-white/10 rounded-xl min-h-[80px] resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleAddAction}
                                                disabled={!actionDesc.trim()}
                                                className="rounded-xl shadow-lg shadow-primary/10"
                                            >
                                                Log Action
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {isMarketing && (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                        <p className="text-xs text-amber-500 font-medium">Marketing users can view the timeline but cannot log actions.</p>
                                    </div>
                                )}

                                {/* Actions Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                        Actions Timeline
                                        <Badge variant="outline" className="text-[10px] border-white/10">
                                            {data.actions?.length || 0} Actions
                                        </Badge>
                                    </h3>
                                    {data.actions?.length > 0 ? (
                                        data.actions.map((a: any) => {
                                            const cfg = ACTION_TYPE_CONFIG[a.type] || ACTION_TYPE_CONFIG.OTHER;
                                            const ActionIcon = cfg.icon;
                                            return (
                                                <div key={a._id} className="relative pl-6 pb-6 border-l border-white/10 last:pb-0">
                                                    <div className={`absolute left-[-9px] top-1 w-[18px] h-[18px] rounded-full bg-card border-2 border-white/20 flex items-center justify-center`}>
                                                        <ActionIcon className={`h-2.5 w-2.5 ${cfg.color}`} />
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={`text-[10px] h-5 ${cfg.color} border-current`}>
                                                                    {cfg.label}
                                                                </Badge>
                                                                {a.outcome && (
                                                                    <Badge variant="secondary" className="text-[10px] h-5 bg-white/10">
                                                                        {a.outcome}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground">{format(new Date(a.createdAt), "MMM d, h:mm a")}</span>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{a.description}</p>
                                                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                                                {a.authorId?.name?.charAt(0) || "?"}
                                                            </div>
                                                            {a.authorId?.name || "Unknown"}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground text-sm italic">
                                            No actions logged yet.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* ─── ACTIVITY LOG TAB ─── */}
                            <TabsContent value="activity" className="mt-0 space-y-6 pb-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Logs & Updates</h3>
                                    <div className="space-y-4">
                                        {data.notes.filter((n: any) => n.type === 'SYSTEM').length > 0 ? (
                                            data.notes.filter((n: any) => n.type === 'SYSTEM').map((n: any) => (
                                                <div key={n._id} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="mt-1">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                            <History className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-xs font-bold text-muted-foreground">System Event</span>
                                                            <span className="text-[10px] text-muted-foreground">{format(new Date(n.createdAt), "MMM d, h:mm a")}</span>
                                                        </div>
                                                        <p className="text-sm italic text-foreground/60">{n.message}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-muted-foreground text-sm italic">
                                                No system activity recorded yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-muted-foreground">Loading details...</span>
                        </div>
                    </div>
                )}

                <div className="p-6 border-t border-white/5 bg-white/5">
                    <Button variant="outline" className="w-full rounded-xl border-white/10" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
