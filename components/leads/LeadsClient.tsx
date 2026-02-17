"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { LeadDetailsSheet } from "@/components/leads/LeadDetailsSheet";
import { format } from "date-fns";
import { Search, FileUp, Download, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { importLeads } from "@/lib/actions/import";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { deleteLead } from "@/lib/actions/leads";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { QuickStatsBar } from "@/components/leads/QuickStatsBar";

function useDebounce(callback: Function, delay: number) {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    return (...args: any[]) => {
        if (timeoutId) clearTimeout(timeoutId);
        setTimeoutId(setTimeout(() => callback(...args), delay));
    };
}

export function LeadsClient({
    leads,
    total,
    stats,
    settings,
    users,
    currentUserRole
}: {
    leads: any[],
    total: number,
    stats: any[],
    settings: any,
    users: any[],
    currentUserRole: string
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const { toast } = useToast();
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [leadToEdit, setLeadToEdit] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const isAdmin = currentUserRole === 'ADMIN';
    const isMarketing = currentUserRole === 'MARKETING';
    const isSales = currentUserRole === 'SALES';
    const canAddLead = isAdmin || isMarketing;
    const canSeeAssignment = isAdmin || isMarketing;

    const handleSearch = useDebounce((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        router.replace(`/leads?${params.toString()}`);
    }, 300);

    const handleStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (params.get("status") === status) {
            params.delete("status");
        } else {
            params.set("status", status);
        }
        router.replace(`/leads?${params.toString()}`);
    }

    const handleExport = () => {
        const params = new URLSearchParams(searchParams);
        window.location.href = `/api/leads/export?${params.toString()}`;
    };

    const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setImporting(true);
        const formData = new FormData(e.currentTarget);
        const result = await importLeads(formData);
        setImporting(false);

        if (result?.success) {
            toast({ title: "Import Successful", description: result.message });
            setIsImportOpen(false);
        } else {
            toast({ title: "Import Failed", description: result?.message || "Unknown error", variant: "destructive" });
        }
    }

    const handleDelete = async () => {
        if (!leadToDelete) return;
        const result = await deleteLead(leadToDelete);
        if (result?.success) {
            toast({ title: "Lead Deleted", description: "The lead has been removed successfully." });
        } else {
            toast({ title: "Error", description: result?.message || "Failed to delete lead", variant: "destructive" });
        }
        setIsDeleteConfirmOpen(false);
        setLeadToDelete(null);
    }

    return (
        <div className="space-y-4">
            <QuickStatsBar
                stats={stats}
                settings={settings}
                currentStatus={searchParams.get("status")}
                onStatusClick={handleStatusFilter}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-sm">
                {/* Status Chips */}
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
                        )
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[200px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-8"
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={searchParams.get("search")?.toString()}
                        />
                    </div>
                    {isAdmin && (
                        <>
                            <Button variant="outline" size="icon" onClick={handleExport} title="Export CSV" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                                <Download className="h-4 w-4" />
                            </Button>

                            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" title="Import CSV" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10">
                                        <FileUp className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Import Leads</DialogTitle>
                                        <DialogDescription>Upload a CSV file. Required column: name. Optional: email, phone, company, status, assignedToEmail, tags.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleImport} className="space-y-4">
                                        <div className="grid w-full max-w-sm items-center gap-1.5">
                                            <Label htmlFor="file">CSV File</Label>
                                            <Input id="file" name="file" type="file" accept=".csv" required />
                                        </div>
                                        <Button type="submit" disabled={importing}>
                                            {importing ? "Importing..." : "Upload & Import"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                    {canAddLead && (
                        <AddLeadDialog settings={settings} users={users} />
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="font-semibold text-primary">Name</TableHead>
                            <TableHead className="font-semibold text-primary">Status</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-primary">Source</TableHead>
                            <TableHead className="font-semibold text-primary w-[50px]">WA</TableHead>
                            {canSeeAssignment && (
                                <TableHead className="hidden md:table-cell font-semibold text-primary">Assigned</TableHead>
                            )}
                            <TableHead className="hidden md:table-cell font-semibold text-primary">Added</TableHead>
                            <TableHead className="text-right font-semibold text-primary">Value</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leads.length > 0 ? (
                            leads.map((lead) => (
                                <TableRow
                                    key={lead._id}
                                    className="cursor-pointer hover:bg-primary/5 border-white/5 transition-colors"
                                    onClick={() => setSelectedLeadId(lead._id)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="text-base text-foreground">{lead.name}</div>
                                        <div className="text-xs text-muted-foreground">{lead.company}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge
                                                variant="outline"
                                                className="w-fit border shadow-sm bg-[var(--badge-bg)] text-[var(--badge-color)] border-[var(--badge-color)]"
                                                style={{
                                                    "--badge-bg": settings?.statuses.find((s: any) => s.key === lead.status)?.color + '15',
                                                    "--badge-color": settings?.statuses.find((s: any) => s.key === lead.status)?.color
                                                } as React.CSSProperties}
                                            >
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

                                    {/* WhatsApp Column */}
                                    <TableCell>
                                        {lead.phone ? (
                                            <a
                                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()} // Prevent row click
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                                                title="Chat on WhatsApp"
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>

                                    {/* Assigned To - Admin & Marketing */}
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
                                                    <DropdownMenuItem onClick={() => setSelectedLeadId(lead._id)} className="cursor-pointer">
                                                        View details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/5" />
                                                    {(isAdmin || isSales) && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setLeadToEdit(lead);
                                                                setIsEditOpen(true);
                                                            }}
                                                            className="cursor-pointer flex items-center gap-2"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Edit Lead
                                                        </DropdownMenuItem>
                                                    )}
                                                    {isAdmin && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setLeadToDelete(lead._id);
                                                                setIsDeleteConfirmOpen(true);
                                                            }}
                                                            className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete Lead
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center">
                                    <div className="flex flex-col items-center gap-3 py-8">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <UserPlus className="h-7 w-7 text-primary/50" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground/70">No leads found</p>
                                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or add a new lead</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {total > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{Math.min((Number(searchParams.get("page") || 1) - 1) * 50 + 1, total)}</span>–<span className="font-semibold text-foreground">{Math.min(Number(searchParams.get("page") || 1) * 50, total)}</span> of <span className="font-semibold text-foreground">{total}</span> leads
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-white/10 h-9"
                            disabled={Number(searchParams.get("page") || 1) <= 1}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set("page", String(Math.max(1, Number(searchParams.get("page") || 1) - 1)));
                                router.replace(`/leads?${params.toString()}`);
                            }}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <div className="text-sm font-medium text-muted-foreground px-2">
                            Page {Number(searchParams.get("page") || 1)} of {Math.max(1, Math.ceil(total / 50))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-white/10 h-9"
                            disabled={Number(searchParams.get("page") || 1) >= Math.ceil(total / 50)}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set("page", String(Number(searchParams.get("page") || 1) + 1));
                                router.replace(`/leads?${params.toString()}`);
                            }}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <LeadDetailsSheet
                leadId={selectedLeadId}
                onClose={() => setSelectedLeadId(null)}
                currentUserRole={currentUserRole}
                settings={settings}
            />

            <EditLeadDialog
                lead={leadToEdit}
                open={isEditOpen}
                setOpen={setIsEditOpen}
                settings={settings}
                users={users}
                currentUserRole={currentUserRole}
            />

            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Delete Lead</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this lead? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="rounded-xl border-white/10">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} className="rounded-xl px-8">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
