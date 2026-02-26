"use client";

import Link from "next/link";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Star, ArrowRightLeft, ChevronUp, ChevronDown, UserPlus, RotateCcw } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface LeadsTableViewProps {
    leads: any[];
    settings: any;
    currentUserId?: string;
    currentSort: string;
    currentDir: string;
    selectedIds: Set<string>;
    isAdmin: boolean;
    isMarketing: boolean;
    isSales: boolean;
    canSeeAssignment: boolean;
    isTrashView: boolean;
    isStarredView: boolean;
    now: Date;
    onSort: (field: string) => void;
    onStar: (id: string) => void;
    onSelect: (id: string) => void;
    onSelectAll: () => void;
    onLeadClick: (id: string) => void;
    onEdit: (lead: any) => void;
    onDelete: (id: string) => void;
    onTransfer: (id: string) => void;
    onRestore: (id: string) => void;
    onPermanentDelete: (id: string) => void;
}

function SortIcon({ field, currentSort, currentDir }: { field: string; currentSort: string; currentDir: string }) {
    if (currentSort !== field) return <ChevronUp className="h-3 w-3 opacity-20 ml-1 inline" />;
    return currentDir === "asc"
        ? <ChevronUp className="h-3 w-3 ml-1 inline text-primary" />
        : <ChevronDown className="h-3 w-3 ml-1 inline text-primary" />;
}

export function LeadsTableView({
    leads, settings, currentUserId, currentSort, currentDir,
    selectedIds, isAdmin, isMarketing, isSales, canSeeAssignment,
    isTrashView, isStarredView, now,
    onSort, onStar, onSelect, onSelectAll, onLeadClick,
    onEdit, onDelete, onTransfer, onRestore, onPermanentDelete,
}: LeadsTableViewProps) {
    return (
        <>
            {/* Mobile Card View — shown only on small screens */}
            {leads.length > 0 && (
                <div className="md:hidden space-y-2">
                    {leads.map((lead) => {
                        const isStarred = lead.starred?.includes(currentUserId);
                        const isOverdue = lead.followUpDate && new Date(lead.followUpDate) <= now;
                        const statusBadge = settings?.statuses?.find((s: any) => s.key === lead.status);
                        return (
                            <div key={lead._id}
                                className={cn("rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-4 space-y-2 cursor-pointer hover:bg-primary/5 transition-colors", selectedIds.has(lead._id) && "bg-primary/10")}
                                onClick={() => onLeadClick(lead._id)}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {lead.serialNumber && <span className="text-[10px] font-mono text-primary/60">LM-{lead.serialNumber}</span>}
                                            <span className="font-semibold text-sm text-foreground truncate">{lead.name}</span>
                                            {isOverdue && <span className="text-amber-400 text-xs">🔔</span>}
                                        </div>
                                        {lead.company && <div className="text-xs text-muted-foreground truncate">{lead.company}</div>}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onStar(lead._id); }}
                                            className="hover:scale-125 transition-transform"
                                            title={isStarred ? "Remove star" : "Star this lead"}
                                            aria-label={isStarred ? "Remove star" : "Star this lead"}
                                        >
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
                                                        <DropdownMenuItem onClick={() => onRestore(lead._id)} className="cursor-pointer text-emerald-400 flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Restore</DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem onClick={() => onPermanentDelete(lead._id)} className="cursor-pointer text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete Permanently</DropdownMenuItem>
                                                    </>) : (<>
                                                        {(isAdmin || isSales) && <DropdownMenuItem onClick={() => onEdit(lead)} className="cursor-pointer flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>}
                                                        {isAdmin && <DropdownMenuItem onClick={() => onDelete(lead._id)} className="cursor-pointer text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>}
                                                    </>)}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {statusBadge && (
                                        <Badge variant="outline" className="text-[11px] h-5 px-1.5 status-chip-dynamic" style={{ '--chip-bg': `${statusBadge.color}15`, '--chip-fg': statusBadge.color, '--chip-border': `${statusBadge.color}50` } as React.CSSProperties}>
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

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="w-[40px]">
                                <input type="checkbox" checked={selectedIds.size === leads.length && leads.length > 0} onChange={onSelectAll}
                                    aria-label="Select all leads"
                                    className="h-4 w-4 rounded accent-primary cursor-pointer" />
                            </TableHead>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead
                                className={cn("w-[80px] font-semibold cursor-pointer hover:text-primary transition-colors text-xs", currentSort === "serialNumber" ? "text-primary" : "text-primary/70")}
                                onClick={() => onSort("serialNumber")}
                            >
                                #<SortIcon field="serialNumber" currentSort={currentSort} currentDir={currentDir} />
                            </TableHead>
                            <TableHead
                                className={cn("font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "name" ? "text-primary" : "text-primary")}
                                onClick={() => onSort("name")}
                            >
                                Name<SortIcon field="name" currentSort={currentSort} currentDir={currentDir} />
                            </TableHead>
                            <TableHead
                                className={cn("font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "status" ? "text-primary" : "text-primary/70")}
                                onClick={() => onSort("status")}
                            >
                                Status<SortIcon field="status" currentSort={currentSort} currentDir={currentDir} />
                            </TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-primary">Source</TableHead>
                            <TableHead className="font-semibold text-primary w-[50px]">WA</TableHead>
                            {canSeeAssignment && (
                                <TableHead className="hidden md:table-cell font-semibold text-primary">Assigned</TableHead>
                            )}
                            <TableHead
                                className={cn("hidden md:table-cell font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "createdAt" ? "text-primary" : "text-primary/70")}
                                onClick={() => onSort("createdAt")}
                            >
                                Added<SortIcon field="createdAt" currentSort={currentSort} currentDir={currentDir} />
                            </TableHead>
                            <TableHead
                                className={cn("hidden lg:table-cell font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "followUpDate" ? "text-primary" : "text-primary/70")}
                                onClick={() => onSort("followUpDate")}
                            >
                                Follow-up<SortIcon field="followUpDate" currentSort={currentSort} currentDir={currentDir} />
                            </TableHead>
                            <TableHead
                                className={cn("text-right font-semibold cursor-pointer hover:text-primary transition-colors", currentSort === "value" ? "text-primary" : "text-primary/70")}
                                onClick={() => onSort("value")}
                            >
                                Value<SortIcon field="value" currentSort={currentSort} currentDir={currentDir} />
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
                                        onClick={() => onLeadClick(lead._id)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.has(lead._id)} onChange={() => onSelect(lead._id)}
                                                aria-label={`Select lead ${lead.name}`}
                                                className="h-4 w-4 rounded accent-primary cursor-pointer" />
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => onStar(lead._id)} title="Toggle star" aria-label={`Toggle star for ${lead.name}`} className="hover:scale-125 transition-transform">
                                                <Star className={cn("h-4 w-4", isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-400/50")} />
                                            </button>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-primary/70 whitespace-nowrap">
                                            {lead.serialNumber ? `LM-${lead.serialNumber}` : "—"}
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
                                                            isAdmin && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => onRestore(lead._id)}
                                                                        className="cursor-pointer flex items-center gap-2 text-emerald-400 focus:text-emerald-400">
                                                                        <RotateCcw className="h-4 w-4" /> Restore Lead
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                                    <DropdownMenuItem
                                                                        onClick={() => onPermanentDelete(lead._id)}
                                                                        className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive">
                                                                        <Trash2 className="h-4 w-4" /> Delete Permanently
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem onClick={() => onLeadClick(lead._id)} className="cursor-pointer">View details</DropdownMenuItem>
                                                                <DropdownMenuSeparator className="bg-white/5" />
                                                                {(isAdmin || isSales) && (
                                                                    <DropdownMenuItem onClick={() => onEdit(lead)} className="cursor-pointer flex items-center gap-2">
                                                                        <Pencil className="h-4 w-4" /> Edit Lead
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {canSeeAssignment && (
                                                                    <DropdownMenuItem onClick={() => onTransfer(lead._id)} className="cursor-pointer flex items-center gap-2">
                                                                        <ArrowRightLeft className="h-4 w-4" /> Transfer Lead
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {isAdmin && (
                                                                    <DropdownMenuItem onClick={() => onDelete(lead._id)}
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
        </>
    );
}
