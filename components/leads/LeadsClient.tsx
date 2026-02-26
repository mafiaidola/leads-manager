"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadDetailsSheet } from "@/components/leads/LeadDetailsSheet";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteLead, toggleStarLead, bulkUpdateStatus, bulkAssign, bulkSoftDelete, transferLead, restoreLead, permanentDeleteLead } from "@/lib/actions/leads";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { QuickStatsBar } from "@/components/leads/QuickStatsBar";
import dynamic from "next/dynamic";
import { ImportDialog } from "@/components/leads/ImportDialog";

// Extracted components
import { LeadsToolbar } from "@/components/leads/LeadsToolbar";
import { LeadsTableView } from "@/components/leads/LeadsTableView";

const KanbanBoard = dynamic(() => import("@/components/leads/KanbanBoard").then(m => m.KanbanBoard), {
    loading: () => <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Kanban board...</div>,
});

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

    // ─── Memoized derived data ──────────────────────────────────────────────
    const activeTag = searchParams.get("tag");
    const isOverdueView = searchParams.get("overdue") === "true";
    const currentSort = searchParams.get("sort") || "createdAt";
    const currentDir = searchParams.get("dir") || "desc";

    const allTags = useMemo(() =>
        Array.from(new Set(
            leads.flatMap((l: any) => Array.isArray(l.tags) ? l.tags : [])
        )).filter(Boolean) as string[],
        [leads]
    );

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleSearch = useDebounce((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) { params.set("search", term); } else { params.delete("search"); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, 300);

    const handleStatusFilter = useCallback((status: string) => {
        const params = new URLSearchParams(searchParams);
        if (params.get("status") === status) { params.delete("status"); } else { params.set("status", status); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, [searchParams, router]);

    const handleSourceFilter = useCallback((source: string) => {
        const params = new URLSearchParams(searchParams);
        if (source === "all") { params.delete("source"); } else { params.set("source", source); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, [searchParams, router]);

    const handleAssigneeFilter = useCallback((userId: string) => {
        const params = new URLSearchParams(searchParams);
        if (userId === "all") { params.delete("assignedTo"); } else { params.set("assignedTo", userId); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, [searchParams, router]);

    const handleSort = useCallback((field: string) => {
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
    }, [searchParams, router]);

    const handleValueRange = useDebounce((min: string, max: string) => {
        const params = new URLSearchParams(searchParams);
        if (min) params.set("minValue", min); else params.delete("minValue");
        if (max) params.set("maxValue", max); else params.delete("maxValue");
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, 500);

    const handleTagFilter = useCallback((tag: string) => {
        const params = new URLSearchParams(searchParams);
        if (params.get("tag") === tag) { params.delete("tag"); } else { params.set("tag", tag); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, [searchParams, router]);

    const handleOverdueFilter = useCallback(() => {
        const params = new URLSearchParams(searchParams);
        if (params.get("overdue") === "true") { params.delete("overdue"); } else { params.set("overdue", "true"); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, [searchParams, router]);

    const now = new Date();

    const handleExport = useCallback((format: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("format", format);
        window.location.href = `/api/leads/export?${params.toString()}`;
    }, [searchParams]);

    const handleCreatedByFilter = useCallback((role: string) => {
        const params = new URLSearchParams(searchParams);
        if (role === "all") { params.delete("createdByRole"); } else { params.set("createdByRole", role); }
        params.delete("page");
        router.replace(`/leads?${params.toString()}`);
    }, [searchParams, router]);

    const handleDelete = useCallback(async () => {
        if (!leadToDelete) return;
        const result = await deleteLead(leadToDelete);
        if (result?.success) {
            toast({ title: "Moved to Trash", description: "The lead has been moved to the recycle bin." });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setIsDeleteConfirmOpen(false);
        setLeadToDelete(null);
    }, [leadToDelete, toast]);

    const handleStar = useCallback(async (id: string) => {
        const result = await toggleStarLead(id);
        if (result?.success) {
            toast({ title: result.starred ? "⭐ Starred" : "Unstarred" });
        }
    }, [toast]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
            return newSet;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            if (prev.size === leads.length) return new Set();
            return new Set(leads.map(l => l._id));
        });
    }, [leads]);

    const handleBulkStatus = useCallback(async (status: string) => {
        const result = await bulkUpdateStatus(Array.from(selectedIds), status);
        if (result?.success) {
            toast({ title: result.message });
            setSelectedIds(new Set());
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setBulkStatusOpen(false);
    }, [selectedIds, toast]);

    const handleBulkAssign = useCallback(async (userId: string) => {
        const result = await bulkAssign(Array.from(selectedIds), userId);
        if (result?.success) {
            toast({ title: result.message });
            setSelectedIds(new Set());
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
        setBulkAssignOpen(false);
    }, [selectedIds, toast]);

    const handleBulkDelete = useCallback(async () => {
        const result = await bulkSoftDelete(Array.from(selectedIds));
        if (result?.success) {
            toast({ title: result.message });
            setSelectedIds(new Set());
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    }, [selectedIds, toast]);

    const handleTransfer = useCallback(async () => {
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
    }, [transferLeadId, transferUserId, toast]);

    const handleRestore = useCallback(async (id: string) => {
        const result = await restoreLead(id);
        if (result?.success) {
            toast({ title: "Lead restored", description: "The lead has been moved back to All Leads." });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    }, [toast]);

    const handlePermanentDelete = useCallback(async (id: string) => {
        const result = await permanentDeleteLead(id);
        if (result?.success) {
            toast({ title: "Permanently deleted", description: "This lead cannot be recovered.", variant: "destructive" });
        } else {
            toast({ title: "Error", description: result?.message, variant: "destructive" });
        }
    }, [toast]);

    const handleViewToggle = useCallback((view: string) => {
        const params = new URLSearchParams();
        if (view === "starred") params.set("starred", "true");
        if (view === "trash") params.set("trash", "true");
        router.replace(`/leads?${params.toString()}`);
    }, [router]);

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

            <LeadsToolbar
                settings={settings}
                users={users}
                searchParams={searchParams}
                isAdmin={isAdmin}
                isMarketing={isMarketing}
                canAddLead={canAddLead}
                canSeeAssignment={canSeeAssignment}
                isStarredView={isStarredView}
                isTrashView={isTrashView}
                isOverdueView={isOverdueView}
                activeTag={activeTag}
                allTags={allTags}
                viewMode={viewMode}
                selectedIds={selectedIds}
                bulkStatusOpen={bulkStatusOpen}
                bulkAssignOpen={bulkAssignOpen}
                onViewModeChange={setViewMode}
                onViewToggle={handleViewToggle}
                onSearch={handleSearch}
                onStatusFilter={handleStatusFilter}
                onSourceFilter={handleSourceFilter}
                onAssigneeFilter={handleAssigneeFilter}
                onTagFilter={handleTagFilter}
                onOverdueFilter={handleOverdueFilter}
                onValueRange={handleValueRange}
                onExport={handleExport}
                onCreatedByFilter={handleCreatedByFilter}
                onImportOpen={() => setIsImportOpen(true)}
                onBulkStatusOpen={setBulkStatusOpen}
                onBulkAssignOpen={setBulkAssignOpen}
                onBulkStatus={handleBulkStatus}
                onBulkAssign={handleBulkAssign}
                onBulkDelete={handleBulkDelete}
                onClearSelection={() => setSelectedIds(new Set())}
            />

            {/* Kanban View */}
            {viewMode === "kanban" && kanbanLeads && (
                <KanbanBoard
                    leads={kanbanLeads}
                    statuses={settings?.statuses || []}
                    currentUserId={currentUserId}
                    onLeadClick={(id) => setSelectedLeadId(id)}
                />
            )}

            {/* Table + Mobile Card Views */}
            {viewMode === "table" && (
                <LeadsTableView
                    leads={leads}
                    settings={settings}
                    currentUserId={currentUserId}
                    currentSort={currentSort}
                    currentDir={currentDir}
                    selectedIds={selectedIds}
                    isAdmin={isAdmin}
                    isMarketing={isMarketing}
                    isSales={isSales}
                    canSeeAssignment={canSeeAssignment}
                    isTrashView={isTrashView}
                    isStarredView={isStarredView}
                    now={now}
                    onSort={handleSort}
                    onStar={handleStar}
                    onSelect={toggleSelect}
                    onSelectAll={toggleSelectAll}
                    onLeadClick={setSelectedLeadId}
                    onEdit={(lead) => { setLeadToEdit(lead); setIsEditOpen(true); }}
                    onDelete={(id) => { setLeadToDelete(id); setIsDeleteConfirmOpen(true); }}
                    onTransfer={(id) => { setTransferLeadId(id); setIsTransferOpen(true); }}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
                />
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
