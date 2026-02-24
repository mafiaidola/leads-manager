"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { LeadDetailsSheet } from "@/components/leads/LeadDetailsSheet";
import { format } from "date-fns";
import { Search, FileUp, Download, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, UserPlus, Filter, Star, ArrowRightLeft, LayoutGrid, Table2, ChevronUp, ChevronDown, Users2, Bell, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { deleteLead, toggleStarLead, bulkUpdateStatus, bulkAssign, bulkSoftDelete, transferLead, restoreLead, permanentDeleteLead } from "@/lib/actions/leads";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { QuickStatsBar } from "@/components/leads/QuickStatsBar";
import { KanbanBoard } from "@/components/leads/KanbanBoard";
import { ImportDialog } from "@/components/leads/ImportDialog";

function useDebounce(callback: Function, delay: number) {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    return (...args: any[]) => {
        if (timeoutId) clearTimeout(timeoutId);
        setTimeoutId(setTimeout(() => callback(...args), delay));
    };
}

export function LeadsClient({
    leads, total, stats, settings, users, currentUserRole, currentUserId, kanbanLeads
}: {
    leads: any[], total: number, stats: any[], settings: any, users: any[], currentUserRole: string, currentUserId?: string, kanbanLeads?: Record<string, any[]>
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => { router.refresh(); }, 60000);
        return () => clearInterval(interval);
    }, [router]);
    const { toast } = useToast();
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
    const [leadToEdit, setLeadToEdit] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

    // Transfer dialog
    const [transferLeadId, setTransferLeadId] = useState<string | null>(null);
    const [transferUserId, setTransferUserId] = useState("");
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    const isAdmin = currentUserRole === 'ADMIN';
    const isMarketing = currentUserRole === 'MARKETING';
    const isSales = currentUserRole === 'SALES';
    const canAddLead = isAdmin || isMarketing;
    const canSeeAssignment = isAdmin || isMarketing;

    const isStarredView = searchParams.get("starred") === "true";
    const isTrashView = searchParams.get("trash") === "true";

    const handleSearch = useDebounce((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) { params.set("search", term); } else { params.delete("search"); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, 300);

    const handleStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (params.get("status") === status) { params.delete("status"); } else { params.set("status", status); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    };

    const handleSourceFilter = (source: string) => {
        const params = new URLSearchParams(searchParams);
        if (source === "all") { params.delete("source"); } else { params.set("source", source); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    };

    const handleAssigneeFilter = (userId: string) => {
        const params = new URLSearchParams(searchParams);
        if (userId === "all") { params.delete("assignedTo"); } else { params.set("assignedTo", userId); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    };

    const handleSort = (field: string) => {
        const params = new URLSearchParams(searchParams);
        const currentSortField = params.get("sort");
        const currentDirValue = params.get("dir");
        if (currentSortField === field) {
            params.set("dir", currentDirValue === "asc" ? "desc" : "asc");
        } else {
            params.set("sort", field);
            params.set("dir", "asc");
        }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    };

    const handleValueRange = useDebounce((min: string, max: string) => {
        const params = new URLSearchParams(searchParams);
        if (min) params.set("minValue", min); else params.delete("minValue");
        if (max) params.set("maxValue", max); else params.delete("maxValue");
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, 500);

    const handleTagFilter = (tag: string) => {
        const params = new URLSearchParams(searchParams);
        if (params.get("tag") === tag) { params.delete("tag"); } else { params.set("tag", tag); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    };

    const handleOverdueFilter = () => {
        const params = new URLSearchParams(searchParams);
        if (params.get("overdue") === "true") { params.delete("overdue"); } else { params.set("overdue", "true"); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    };

    // Derive unique tags from current page of leads
    const allTags = Array.from(new Set(
        leads.flatMap((l: any) => Array.isArray(l.tags) ? l.tags : [])
    )).filter(Boolean) as string[];

    const activeTag = searchParams.get("tag");
    const isOverdueView = searchParams.get("overdue") === "true";
    const now = new Date();

    const currentSort = searchParams.get("sort") || "createdAt";
    const currentDir = searchParams.get("dir") || "desc";

    const SortIcon = ({ field }: { field: string }) => {
        if (currentSort !== field) return <ChevronUp className="h-3 w-3 opacity-20 ml-1 inline" />;
        return currentDir === "asc"
            ? <ChevronUp className="h-3 w-3 ml-1 inline text-primary" />
            : <ChevronDown className="h-3 w-3 ml-1 inline text-primary" />;
    };

    const handleExport = () => {
        const params = new URLSearchParams(searchParams);
        window.location.href = `/api/leads/export?${params.toString()}`;
    };

    const handleDelete = async () => {
        if (!leadToDelete) return;
        const result = await deleteLead(leadToDelete);
        if (result?.success) {
            toast({ title: "Moved to Trash", description: "The lead has been moved to the recycle bin." });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setIsDeleteConfirmOpen(false);
        setLeadToDelete(null);
    };

    const handleStar = async (id: string) => {
        const result = await toggleStarLead(id);
        if (result?.success) {
            toast({ title: result.starred ? "⭐ Starred" : "Unstarred" });
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === leads.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(leads.map(l => l._id)));
        }
    };

    const handleBulkStatus = async (status: string) => {
        const result = await bulkUpdateStatus(Array.from(selectedIds), status);
        if (result?.success) {
            toast({ title: result.message });
            setSelectedIds(new Set());
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setBulkStatusOpen(false);
    };

    const handleBulkAssign = async (userId: string) => {
        const result = await bulkAssign(Array.from(selectedIds), userId);
        if (result?.success) {
            toast({ title: result.message });
            setSelectedIds(new Set());
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setBulkAssignOpen(false);
    };

    const handleBulkDelete = async () => {
        const result = await bulkSoftDelete(Array.from(selectedIds));
        if (result?.success) {
            toast({ title: result.message });
            setSelectedIds(new Set());
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    };

    const handleTransfer = async () => {
        if (!transferLeadId || !transferUserId) return;
        const result = await transferLead(transferLeadId, transferUserId);
        if (result?.success) {
            toast({ title: "Lead transferred" });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setIsTransferOpen(false);
        setTransferLeadId(null);
        setTransferUserId("");
    };

    const handleRestore = async (id: string) => {
        const result = await restoreLead(id);
        if (result?.success) {
            toast({ title: "Lead restored", description: "The lead has been moved back to All Leads." });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    };

    const handlePermanentDelete = async (id: string) => {
        const result = await permanentDeleteLead(id);
        if (result?.success) {
            toast({ title: "Permanently deleted", description: "This lead cannot be recovered.", variant: "destructive" });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    };

    const handleViewToggle = (view: string) => {
        const params = new URLSearchParams();
        if (view === "starred") params.set("starred", "true");
        if (view === "trash") params.set("trash", "true");
        router.replace(`/leads?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            {!isTrashView && (
                <QuickStatsBar
                    stats={stats}
                    settings={settings}
                    currentStatus={searchParams.get("status")}
                    onStatusClick={handleStatusFilter}
                />
            )}

            {/* View Toggle Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button variant={!isStarredView && !isTrashView ? "default" : "outline"} size="sm"
                        onClick={() => handleViewToggle("all")}
                        className="rounded-xl border-white/10">
                        All Leads
                    </Button>
                    <Button variant={isStarredView ? "default" : "outline"} size="sm"
                        onClick={() => handleViewToggle("starred")}
                        className={cn("rounded-xl border-white/10", isStarredView && "bg-amber-500 hover:bg-amber-600")}>
                        <Star className="h-3.5 w-3.5 mr-1.5" /> Starred
                    </Button>
                    {!isTrashView && !isStarredView && (
                        <Button variant={isOverdueView ? "default" : "outline"} size="sm"
                            onClick={handleOverdueFilter}
                            className={cn("rounded-xl border-white/10", isOverdueView && "bg-amber-500 hover:bg-amber-600")}>
                            <Bell className="h-3.5 w-3.5 mr-1.5" /> Overdue
                        </Button>
                    )}
                    {isAdmin && (
                        <Button variant={isTrashView ? "default" : "outline"} size="sm"
                            onClick={() => handleViewToggle("trash")}
                            className={cn("rounded-xl border-white/10", isTrashView && "bg-red-500 hover:bg-red-600")}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Recycle Bin
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
                    <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")}
                        className={cn("rounded-lg h-7 px-2.5", viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground")}>
                        <Table2 className="h-3.5 w-3.5 mr-1" /> Table
                    </Button>
                    <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("kanban")}
                        className={cn("rounded-lg h-7 px-2.5", viewMode === "kanban" ? "bg-primary text-white" : "text-muted-foreground")}>
                        <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Board
                    </Button>
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl animate-in slide-in-from-top-2">
                    <Badge className="bg-primary text-white rounded-full px-3 font-bold">{selectedIds.size} selected</Badge>

                    <DropdownMenu open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl border-white/10 h-8">Change Status</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            {settings?.statuses.map((s: any) => (
                                <DropdownMenuItem key={s.key} onClick={() => handleBulkStatus(s.key)} className="cursor-pointer">
                                    <span className="w-2 h-2 rounded-full mr-2 status-dot" style={{ '--status-color': s.color } as React.CSSProperties} aria-hidden="true" />
                                    {s.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {canSeeAssignment && (
                        <DropdownMenu open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl border-white/10 h-8">Assign</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                {users.map((u: any) => (
                                    <DropdownMenuItem key={u._id} onClick={() => handleBulkAssign(u._id)} className="cursor-pointer">
                                        {u.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {isAdmin && (
                        <Button variant="destructive" size="sm" className="rounded-xl h-8" onClick={handleBulkDelete}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                        </Button>
                    )}

                    <Button variant="ghost" size="sm" className="rounded-xl h-8 ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                </div>
            )}

            {/* Primary filters: status chips + search/source/actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {settings?.statuses.map((s: any) => {
                        const isActive = searchParams.get("status") === s.key;
                        return (
                            <Badge
                                key={s.key}
                                variant={isActive ? "default" : "outline"}
                                className={cn(
                                    "cursor-pointer transition-all active:scale-95 border hover:bg-white/5",
                                    isActive
                                        ? "bg-[var(--chip-color)] border-[var(--chip-color)] hover:bg-[var(--chip-color)]/90 text-white shadow-lg shadow-[var(--chip-shadow)]"
                                        : "border-[var(--chip-color)] text-[var(--chip-color)]"
                                )}
                                onClick={() => handleStatusFilter(s.key)}
                                style={{
                                    "--chip-color": s.color || "#8b5cf6",
                                    "--chip-shadow": `${s.color || "#8b5cf6"}33`
                                } as React.CSSProperties}
                            >
                                {s.label}
                            </Badge>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[200px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search leads..." className="pl-8" onChange={(e) => handleSearch(e.target.value)} defaultValue={searchParams.get("search")?.toString()} />
                    </div>
                    <Select value={searchParams.get("source") || "all"} onValueChange={handleSourceFilter}>
                        <SelectTrigger className="w-[140px] rounded-xl border-white/10 bg-white/5">
                            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            <SelectItem value="all">All Sources</SelectItem>
                            {settings?.sources?.map((s: any) => (
                                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isAdmin && (
                        <>
                            <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setIsImportOpen(true)} title="Import CSV" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                                <FileUp className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {canAddLead && <AddLeadDialog settings={settings} users={users} />}
                </div>
            </div>

            {/* Secondary filter row: Assignee + Value range */}
            {!isTrashView && (isAdmin || isMarketing) && (
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={searchParams.get("assignedTo") || "all"} onValueChange={handleAssigneeFilter}>
                        <SelectTrigger className="w-[160px] rounded-xl border-white/10 bg-white/5 h-8 text-xs">
                            <Users2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <SelectValue placeholder="All Agents" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            <SelectItem value="all">All Agents</SelectItem>
                            {users.map((u: any) => (
                                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Value:</span>
                        <Input
                            type="number"
                            placeholder="Min"
                            defaultValue={searchParams.get("minValue") || ""}
                            onChange={(e) => handleValueRange(e.target.value, searchParams.get("maxValue") || "")}
                            className="w-20 h-8 text-xs rounded-xl border-white/10 bg-white/5"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                            type="number"
                            placeholder="Max"
                            defaultValue={searchParams.get("maxValue") || ""}
                            onChange={(e) => handleValueRange(searchParams.get("minValue") || "", e.target.value)}
                            className="w-20 h-8 text-xs rounded-xl border-white/10 bg-white/5"
                        />
                    </div>
                </div>
            )}

            {/* Tag filter badges row */}
            {!isTrashView && allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-muted-foreground">Tags:</span>
                    {allTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => handleTagFilter(tag)}
                            className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] border transition-all",
                                activeTag === tag
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                    {activeTag && (
                        <button onClick={() => handleTagFilter(activeTag)} className="text-[10px] text-muted-foreground hover:text-destructive ml-1">✕ clear</button>
                    )}
                </div>
            )}

            {/* Kanban View */}
            {viewMode === "kanban" && kanbanLeads && (
                <KanbanBoard
                    leads={kanbanLeads}
                    statuses={settings?.statuses || []}
                    currentUserId={currentUserId}
                    onLeadClick={(id) => setSelectedLeadId(id)}
                />
            )}

            {/* Mobile Card View — shown only on small screens in table mode */}
            {viewMode === "table" && leads.length > 0 && (
                <div className="md:hidden space-y-2">
                    {leads.map((lead) => {
                        const isStarred = lead.starred?.includes(currentUserId);
                        const isOverdue = lead.followUpDate && new Date(lead.followUpDate) <= now;
                        const statusBadge = settings?.statuses?.find((s: any) => s.key === lead.status);
                        return (
                            <div key={lead._id}
                                className={cn("rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-4 space-y-2 cursor-pointer hover:bg-primary/5 transition-colors", selectedIds.has(lead._id) && "bg-primary/10")}
                                onClick={() => setSelectedLeadId(lead._id)}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-sm text-foreground truncate">{lead.name}</span>
                                            {isOverdue && <span className="text-amber-400 text-xs">🔔</span>}
                                        </div>
                                        {lead.company && <div className="text-xs text-muted-foreground truncate">{lead.company}</div>}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button onClick={(e) => { e.stopPropagation(); handleStar(lead._id); }} className="hover:scale-125 transition-transform">
                                            <Star className={cn("h-4 w-4", isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                                        </button>
                                        {!isMarketing && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-primary/10">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                    {isTrashView ? (isAdmin && <>
                                                        <DropdownMenuItem onClick={() => handleRestore(lead._id)} className="cursor-pointer text-emerald-400 flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Restore</DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem onClick={() => handlePermanentDelete(lead._id)} className="cursor-pointer text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete Permanently</DropdownMenuItem>
                                                    </>) : (<>
                                                        {(isAdmin || isSales) && <DropdownMenuItem onClick={() => { setLeadToEdit(lead); setIsEditOpen(true); }} className="cursor-pointer flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>}
                                                        {isAdmin && <DropdownMenuItem onClick={() => { setLeadToDelete(lead._id); setIsDeleteConfirmOpen(true); }} className="cursor-pointer text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>}
                                                    </>)}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {statusBadge && (
                                        <Badge variant="outline" className="text-[11px] h-5 px-1.5" style={{ backgroundColor: `${statusBadge.color}15`, color: statusBadge.color, borderColor: `${statusBadge.color}50` }}>
                                            {statusBadge.label || lead.status}
                                        </Badge>
                                    )}
                                    {lead.source && <span className="text-[11px] text-muted-foreground">{lead.source}</span>}
                                    {lead.value && <span className="text-[11px] font-semibold text-primary ml-auto">{lead.currency} {lead.value}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {lead.phone && (
                                        <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 text-[11px] text-green-400 hover:underline">
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                            WhatsApp
                                        </a>
                                    )}
                                    {isOverdue && (
                                        <span className="text-[11px] text-red-400 ml-auto">🔔 {new Date(lead.followUpDate).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table View — hidden on mobile, shown md+ */}
            {viewMode === "table" && (
                <div className="hidden md:block rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="w-[40px]">
                                    <input type="checkbox" checked={selectedIds.size === leads.length && leads.length > 0} onChange={toggleSelectAll}
                                        aria-label="Select all leads"
                                        className="h-4 w-4 rounded accent-primary cursor-pointer" />
                                </TableHead>
                                <TableHead className="w-[30px]"></TableHead>
                                <TableHead
                                    className={cn("font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "name" ? "text-primary" : "text-primary")}
                                    onClick={() => handleSort("name")}
                                >
                                    Name<SortIcon field="name" />
                                </TableHead>
                                <TableHead
                                    className={cn("font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "status" ? "text-primary" : "text-primary/70")}
                                    onClick={() => handleSort("status")}
                                >
                                    Status<SortIcon field="status" />
                                </TableHead>
                                <TableHead className="hidden md:table-cell font-semibold text-primary">Source</TableHead>
                                <TableHead className="font-semibold text-primary w-[50px]">WA</TableHead>
                                {canSeeAssignment && (
                                    <TableHead className="hidden md:table-cell font-semibold text-primary">Assigned</TableHead>
                                )}
                                <TableHead
                                    className={cn("hidden md:table-cell font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "createdAt" ? "text-primary" : "text-primary/70")}
                                    onClick={() => handleSort("createdAt")}
                                >
                                    Added<SortIcon field="createdAt" />
                                </TableHead>
                                <TableHead
                                    className={cn("hidden lg:table-cell font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "followUpDate" ? "text-primary" : "text-primary/70")}
                                    onClick={() => handleSort("followUpDate")}
                                >
                                    Follow-up<SortIcon field="followUpDate" />
                                </TableHead>
                                <TableHead
                                    className={cn("text-right font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "value" ? "text-primary" : "text-primary/70")}
                                    onClick={() => handleSort("value")}
                                >
                                    Value<SortIcon field="value" />
                                </TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.length > 0 ? (
                                leads.map((lead) => {
                                    const isStarred = lead.starred?.includes(currentUserId);
                                    return (
                                        <TableRow
                                            key={lead._id}
                                            className={cn("cursor-pointer hover:bg-primary/5 border-white/5 transition-colors",
                                                selectedIds.has(lead._id) && "bg-primary/10")}
                                            onClick={() => setSelectedLeadId(lead._id)}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedIds.has(lead._id)} onChange={() => toggleSelect(lead._id)}
                                                    aria-label={`Select lead ${lead.name}`}
                                                    className="h-4 w-4 rounded accent-primary cursor-pointer" />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => handleStar(lead._id)} title="Toggle star" aria-label={`Toggle star for ${lead.name}`} className="hover:scale-125 transition-transform">
                                                    <Star className={cn("h-4 w-4", isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-400/50")} />
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link href={`/leads/${lead._id}`} className="group/name">
                                                    <div className="text-base text-foreground group-hover/name:text-primary transition-colors flex items-center gap-1.5">
                                                        {lead.name}
                                                        {lead.followUpDate && new Date(lead.followUpDate) <= now && (
                                                            <span title={`Follow-up: ${new Date(lead.followUpDate).toLocaleDateString()}`} className="text-amber-400 text-sm">🔔</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>{lead.company}</span>
                                                        {(lead.noteCount > 0 || lead.actionCount > 0) && (
                                                            <span className="flex items-center gap-1.5 text-[10px]">
                                                                {lead.noteCount > 0 && <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full" title={`${lead.noteCount} notes`}>📝 {lead.noteCount}</span>}
                                                                {lead.actionCount > 0 && <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full" title={`${lead.actionCount} actions`}>📞 {lead.actionCount}</span>}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline"
                                                        className="w-fit border shadow-sm bg-[var(--badge-bg)] text-[var(--badge-color)] border-[var(--badge-color)]"
                                                        style={{
                                                            "--badge-bg": settings?.statuses.find((s: any) => s.key === lead.status)?.color + '15',
                                                            "--badge-color": settings?.statuses.find((s: any) => s.key === lead.status)?.color
                                                        } as React.CSSProperties}>
                                                        {settings?.statuses.find((s: any) => s.key === lead.status)?.label || lead.status}
                                                    </Badge>
                                                    {lead.product && (
                                                        <Badge variant="secondary" className="w-fit text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                                                            {settings?.products?.find((p: any) => p.key === lead.product)?.label || lead.product}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{lead.source}</TableCell>
                                            <TableCell>
                                                {lead.phone ? (
                                                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                                                        title="Chat on WhatsApp">
                                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                        </svg>
                                                    </a>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            {canSeeAssignment && (
                                                <TableCell className="hidden md:table-cell">
                                                    {lead.assignedTo ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                                                                {lead.assignedTo.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm">{lead.assignedTo.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                                {format(new Date(lead.createdAt), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {lead.followUpDate ? (
                                                    <span className={cn(
                                                        "text-xs font-medium px-1.5 py-0.5 rounded-md",
                                                        new Date(lead.followUpDate) <= now
                                                            ? "bg-red-500/10 text-red-400"
                                                            : "bg-amber-500/10 text-amber-400"
                                                    )}>
                                                        {format(new Date(lead.followUpDate), "MMM d, yyyy")}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-foreground/80">
                                                {lead.value ? `${lead.currency} ${lead.value}` : "-"}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                {!isMarketing && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {isTrashView ? (
                                                                // ── Trash view: Restore or Permanently Delete ──
                                                                isAdmin && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRestore(lead._id)}
                                                                            className="cursor-pointer flex items-center gap-2 text-emerald-400 focus:text-emerald-400">
                                                                            <RotateCcw className="h-4 w-4" /> Restore Lead
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handlePermanentDelete(lead._id)}
                                                                            className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive">
                                                                            <Trash2 className="h-4 w-4" /> Delete Permanently
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )
                                                            ) : (
                                                                // ── Normal view: standard actions ──
                                                                <>
                                                                    <DropdownMenuItem onClick={() => setSelectedLeadId(lead._id)} className="cursor-pointer">View details</DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                                    {(isAdmin || isSales) && (
                                                                        <DropdownMenuItem onClick={() => { setLeadToEdit(lead); setIsEditOpen(true); }} className="cursor-pointer flex items-center gap-2">
                                                                            <Pencil className="h-4 w-4" /> Edit Lead
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {canSeeAssignment && (
                                                                        <DropdownMenuItem onClick={() => { setTransferLeadId(lead._id); setIsTransferOpen(true); }} className="cursor-pointer flex items-center gap-2">
                                                                            <ArrowRightLeft className="h-4 w-4" /> Transfer Lead
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {isAdmin && (
                                                                        <DropdownMenuItem onClick={() => { setLeadToDelete(lead._id); setIsDeleteConfirmOpen(true); }}
                                                                            className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2">
                                                                            <Trash2 className="h-4 w-4" /> Delete Lead
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3 py-8">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                {isTrashView ? <Trash2 className="h-7 w-7 text-red-400/50" /> : isStarredView ? <Star className="h-7 w-7 text-amber-400/50" /> : <UserPlus className="h-7 w-7 text-primary/50" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground/70">
                                                    {isTrashView ? "Recycle bin is empty" : isStarredView ? "No starred leads" : "No leads found"}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {isTrashView ? "Deleted leads will appear here" : isStarredView ? "Star leads to see them here" : "Try adjusting your filters or add a new lead"}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {total > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{Math.min((Number(searchParams.get("page") || 1) - 1) * 50 + 1, total)}</span>–<span className="font-semibold text-foreground">{Math.min(Number(searchParams.get("page") || 1) * 50, total)}</span> of <span className="font-semibold text-foreground">{total}</span> leads
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-white/10 h-9"
                            disabled={Number(searchParams.get("page") || 1) <= 1}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set("page", String(Math.max(1, Number(searchParams.get("page") || 1) - 1)));
                                router.replace(`/leads?${params.toString()}`);
                            }}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <div className="text-sm font-medium text-muted-foreground px-2">
                            Page {Number(searchParams.get("page") || 1)} of {Math.max(1, Math.ceil(total / 50))}
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl border-white/10 h-9"
                            disabled={Number(searchParams.get("page") || 1) >= Math.ceil(total / 50)}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set("page", String(Number(searchParams.get("page") || 1) + 1));
                                router.replace(`/leads?${params.toString()}`);
                            }}>
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <LeadDetailsSheet leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} currentUserRole={currentUserRole} settings={settings} />
            <EditLeadDialog lead={leadToEdit} open={isEditOpen} setOpen={setIsEditOpen} settings={settings} users={users} currentUserRole={currentUserRole} />
            <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />

            {/* Delete Confirm Dialog */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Move to Recycle Bin</DialogTitle>
                        <DialogDescription>This lead will be moved to the recycle bin. You can restore it later.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="rounded-xl border-white/10">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} className="rounded-xl px-8">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Transfer Lead</DialogTitle>
                        <DialogDescription>Assign this lead to another team member.</DialogDescription>
                    </DialogHeader>
                    <Select value={transferUserId} onValueChange={setTransferUserId}>
                        <SelectTrigger className="rounded-xl border-white/10 bg-black/20"><SelectValue placeholder="Select user..." /></SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            {users.map((u: any) => (
                                <SelectItem key={u._id} value={u._id}>{u.name} ({u.role})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsTransferOpen(false)} className="rounded-xl border-white/10">Cancel</Button>
                        <Button onClick={handleTransfer} disabled={!transferUserId} className="rounded-xl bg-primary px-8">Transfer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
