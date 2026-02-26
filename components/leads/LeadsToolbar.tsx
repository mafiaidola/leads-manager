"use client";

import { ReadonlyURLSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { Search, FileUp, Download, Trash2, Filter, Star, LayoutGrid, Table2, Users2, Bell, FileSpreadsheet, FileText, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface LeadsToolbarProps {
    settings: any;
    users: any[];
    searchParams: ReadonlyURLSearchParams;
    isAdmin: boolean;
    isMarketing: boolean;
    canAddLead: boolean;
    canSeeAssignment: boolean;
    isStarredView: boolean;
    isTrashView: boolean;
    isOverdueView: boolean;
    activeTag: string | null;
    allTags: string[];
    viewMode: "table" | "kanban";
    selectedIds: Set<string>;
    bulkStatusOpen: boolean;
    bulkAssignOpen: boolean;
    onViewModeChange: (mode: "table" | "kanban") => void;
    onViewToggle: (view: string) => void;
    onSearch: (term: string) => void;
    onStatusFilter: (status: string) => void;
    onSourceFilter: (source: string) => void;
    onAssigneeFilter: (userId: string) => void;
    onTagFilter: (tag: string) => void;
    onOverdueFilter: () => void;
    onValueRange: (min: string, max: string) => void;
    onExport: (format: string) => void;
    onCreatedByFilter: (role: string) => void;
    onImportOpen: () => void;
    onBulkStatusOpen: (open: boolean) => void;
    onBulkAssignOpen: (open: boolean) => void;
    onBulkStatus: (status: string) => void;
    onBulkAssign: (userId: string) => void;
    onBulkDelete: () => void;
    onClearSelection: () => void;
}

export function LeadsToolbar({
    settings, users, searchParams,
    isAdmin, isMarketing, canAddLead, canSeeAssignment,
    isStarredView, isTrashView, isOverdueView, activeTag, allTags,
    viewMode, selectedIds, bulkStatusOpen, bulkAssignOpen,
    onViewModeChange, onViewToggle, onSearch, onStatusFilter, onSourceFilter,
    onAssigneeFilter, onTagFilter, onOverdueFilter, onValueRange,
    onExport, onCreatedByFilter, onImportOpen, onBulkStatusOpen, onBulkAssignOpen,
    onBulkStatus, onBulkAssign, onBulkDelete, onClearSelection,
}: LeadsToolbarProps) {
    return (
        <>
            {/* View Toggle Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button variant={!isStarredView && !isTrashView ? "default" : "outline"} size="sm"
                        onClick={() => onViewToggle("all")}
                        className="rounded-xl border-white/10">
                        All Leads
                    </Button>
                    <Button variant={isStarredView ? "default" : "outline"} size="sm"
                        onClick={() => onViewToggle("starred")}
                        className={cn("rounded-xl border-white/10", isStarredView && "bg-amber-500 hover:bg-amber-600")}>
                        <Star className="h-3.5 w-3.5 mr-1.5" /> Starred
                    </Button>
                    {!isTrashView && !isStarredView && (
                        <Button variant={isOverdueView ? "default" : "outline"} size="sm"
                            onClick={onOverdueFilter}
                            className={cn("rounded-xl border-white/10", isOverdueView && "bg-amber-500 hover:bg-amber-600")}>
                            <Bell className="h-3.5 w-3.5 mr-1.5" /> Overdue
                        </Button>
                    )}
                    {isAdmin && (
                        <Button variant={isTrashView ? "default" : "outline"} size="sm"
                            onClick={() => onViewToggle("trash")}
                            className={cn("rounded-xl border-white/10", isTrashView && "bg-red-500 hover:bg-red-600")}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Recycle Bin
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
                    <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => onViewModeChange("table")}
                        className={cn("rounded-lg h-7 px-2.5", viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground")}>
                        <Table2 className="h-3.5 w-3.5 mr-1" /> Table
                    </Button>
                    <Button variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" onClick={() => onViewModeChange("kanban")}
                        className={cn("rounded-lg h-7 px-2.5", viewMode === "kanban" ? "bg-primary text-white" : "text-muted-foreground")}>
                        <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Board
                    </Button>
                </div>
            </div>

            {/* Bulk Action Toolbar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl animate-in slide-in-from-top-2">
                    <Badge className="bg-primary text-white rounded-full px-3 font-bold">{selectedIds.size} selected</Badge>

                    <DropdownMenu open={bulkStatusOpen} onOpenChange={onBulkStatusOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl border-white/10 h-8">Change Status</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            {settings?.statuses.map((s: any) => (
                                <DropdownMenuItem key={s.key} onClick={() => onBulkStatus(s.key)} className="cursor-pointer">
                                    <span className="w-2 h-2 rounded-full mr-2 status-dot" style={{ '--status-color': s.color } as React.CSSProperties} aria-hidden="true" />
                                    {s.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {canSeeAssignment && (
                        <DropdownMenu open={bulkAssignOpen} onOpenChange={onBulkAssignOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl border-white/10 h-8">Assign</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                {users.map((u: any) => (
                                    <DropdownMenuItem key={u._id} onClick={() => onBulkAssign(u._id)} className="cursor-pointer">
                                        {u.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {isAdmin && (
                        <Button variant="destructive" size="sm" className="rounded-xl h-8" onClick={onBulkDelete}>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                        </Button>
                    )}

                    <Button variant="ghost" size="sm" className="rounded-xl h-8 ml-auto" onClick={onClearSelection}>Clear</Button>
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
                                onClick={() => onStatusFilter(s.key)}
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

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[200px] order-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search leads..." className="pl-8" onChange={(e) => onSearch(e.target.value)} defaultValue={searchParams.get("search")?.toString()} />
                    </div>
                    <Select value={searchParams.get("source") || "all"} onValueChange={onSourceFilter}>
                        <SelectTrigger className="w-[120px] sm:w-[140px] rounded-xl border-white/10 bg-white/5 order-2">
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" title="Export" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 order-3">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                    <DropdownMenuItem onClick={() => onExport("csv")} className="cursor-pointer">
                                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" /> CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onExport("excel")} className="cursor-pointer">
                                        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" /> Excel (.xlsx)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onExport("word")} className="cursor-pointer">
                                        <FileText className="h-4 w-4 mr-2 text-blue-500" /> Word (.docx)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" size="icon" onClick={onImportOpen} title="Import CSV" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 order-4">
                                <FileUp className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {canAddLead && <div className="order-5"><AddLeadDialog settings={settings} users={users} /></div>}
                </div>
            </div>

            {/* Secondary filter row: Assignee + Value range */}
            {!isTrashView && (isAdmin || isMarketing) && (
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={searchParams.get("assignedTo") || "all"} onValueChange={onAssigneeFilter}>
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
                            onChange={(e) => onValueRange(e.target.value, searchParams.get("maxValue") || "")}
                            className="w-20 h-8 text-xs rounded-xl border-white/10 bg-white/5"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                            type="number"
                            placeholder="Max"
                            defaultValue={searchParams.get("maxValue") || ""}
                            onChange={(e) => onValueRange(searchParams.get("minValue") || "", e.target.value)}
                            className="w-20 h-8 text-xs rounded-xl border-white/10 bg-white/5"
                        />
                    </div>

                    {/* Added By role filter */}
                    <Select value={searchParams.get("createdByRole") || "all"} onValueChange={onCreatedByFilter}>
                        <SelectTrigger className="w-[160px] rounded-xl border-white/10 bg-white/5 h-8 text-xs">
                            <UserPlus className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <SelectValue placeholder="Added By" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                            <SelectItem value="all">All Creators</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MARKETING">Marketing</SelectItem>
                            <SelectItem value="SALES">Sales</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Tag filter badges row */}
            {!isTrashView && allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-muted-foreground">Tags:</span>
                    {allTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onTagFilter(tag)}
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
                        <button onClick={() => onTagFilter(activeTag)} className="text-[10px] text-muted-foreground hover:text-destructive ml-1">✕ clear</button>
                    )}
                </div>
            )}
        </>
    );
}
