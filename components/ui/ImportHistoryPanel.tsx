/**
 * @component ImportHistoryPanel
 * @description Displays a history of lead import operations.
 * Reads from localStorage for now (can be upgraded to server-side storage later).
 * Shows import date, filename, success/fail counts, and status.
 */
"use client";

import React, { useState, useEffect } from "react";
import { FileUp, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ImportRecord {
    id: string;
    filename: string;
    date: string;
    totalRows: number;
    successCount: number;
    failCount: number;
    duplicateCount: number;
}

const STORAGE_KEY = "leads-import-history";

function getHistory(): ImportRecord[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

/** Call this from ImportDialog after a successful import */
export function logImport(record: Omit<ImportRecord, "id" | "date">) {
    const history = getHistory();
    history.unshift({
        ...record,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
    });
    // Keep last 20 records
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    // Dispatch event so the panel updates
    window.dispatchEvent(new CustomEvent("import-logged"));
}

export function ImportHistoryPanel() {
    const [history, setHistory] = useState<ImportRecord[]>([]);

    useEffect(() => {
        setHistory(getHistory());

        const handler = () => setHistory(getHistory());
        window.addEventListener("import-logged", handler);
        return () => window.removeEventListener("import-logged", handler);
    }, []);

    const clearHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
    };

    if (history.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <FileUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No import history yet</p>
                <p className="text-xs mt-1">Import history will appear here after your first import.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent Imports ({history.length})
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-7 text-xs text-muted-foreground hover:text-red-400 rounded-lg"
                    aria-label="Clear import history"
                >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                {history.map((record) => {
                    const isSuccess = record.failCount === 0;
                    const successRate = record.totalRows > 0
                        ? Math.round((record.successCount / record.totalRows) * 100)
                        : 0;

                    return (
                        <div
                            key={record.id}
                            className={cn(
                                "p-3 rounded-2xl border transition-colors",
                                isSuccess
                                    ? "bg-emerald-500/5 border-emerald-500/10"
                                    : "bg-amber-500/5 border-amber-500/10"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileUp className={cn(
                                        "h-4 w-4",
                                        isSuccess ? "text-emerald-400" : "text-amber-400"
                                    )} />
                                    <span className="text-sm font-medium truncate max-w-[200px]">
                                        {record.filename}
                                    </span>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[9px] px-1.5 h-4 font-bold",
                                        isSuccess
                                            ? "text-emerald-400 border-emerald-400/30"
                                            : "text-amber-400 border-amber-400/30"
                                    )}
                                >
                                    {successRate}%
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                    {record.successCount} imported
                                </span>
                                {record.failCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <XCircle className="h-3 w-3 text-red-400" />
                                        {record.failCount} failed
                                    </span>
                                )}
                                {record.duplicateCount > 0 && (
                                    <span className="flex items-center gap-1 text-amber-400">
                                        ⚠ {record.duplicateCount} dupes
                                    </span>
                                )}
                                <span className="flex items-center gap-1 ml-auto">
                                    <Clock className="h-3 w-3" />
                                    {new Date(record.date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
