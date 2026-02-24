"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "@/lib/actions/audit";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    ChevronLeft, ChevronRight, Search, Filter, Shield, Clock, User, FileText
} from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
    IMPORT: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    EXPORT: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    LOGIN: "bg-green-500/10 text-green-500 border-green-500/20",
    TRANSFER: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    RESTORE: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    BULK_UPDATE: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    BULK_DELETE: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

export function AuditClient() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const limit = 20;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const params: any = { page, limit };
        if (actionFilter !== "all") params.action = actionFilter;
        if (entityFilter !== "all") params.entityType = entityFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const result = await getAuditLogs(params);
        setLogs(result.logs);
        setTotal(result.total);
        setLoading(false);
    }, [page, actionFilter, entityFilter, searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
                    <p className="text-sm text-muted-foreground">Track all system actions and changes</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs border-white/10">
                    {total} Total Events
                </Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search user or details..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pl-9 bg-white/5 border-white/10 rounded-xl"
                    />
                </div>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10 rounded-xl">
                        <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                        <SelectItem value="IMPORT">Import</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="RESTORE">Restore</SelectItem>
                        <SelectItem value="EXPORT">Export</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="BULK_UPDATE">Bulk Update</SelectItem>
                        <SelectItem value="BULK_DELETE">Bulk Delete</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10 rounded-xl">
                        <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <SelectValue placeholder="Entity" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="SETTINGS">Settings</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading audit logs...</span>
                        </div>
                    </div>
                ) : logs.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="w-[120px]">Action</TableHead>
                                <TableHead className="w-[100px]">Entity</TableHead>
                                <TableHead className="w-[140px]">User</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log._id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] rounded-lg ${ACTION_COLORS[log.action] || "bg-white/5 text-foreground border-white/10"}`}>
                                            {log.action.replace(/_/g, " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[10px] bg-white/10">
                                            {log.entityType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                                {log.userName?.charAt(0) || "?"}
                                            </div>
                                            <span className="text-xs font-medium truncate max-w-[100px]">
                                                {log.userName || "System"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-foreground/70 max-w-[300px] truncate">
                                        {log.details || "—"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-20 text-muted-foreground text-sm">
                        No audit logs found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-muted-foreground">
                        Page {page} of {totalPages} ({total} events)
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="h-8 w-8 rounded-xl border-white/10">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="h-8 w-8 rounded-xl border-white/10">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
